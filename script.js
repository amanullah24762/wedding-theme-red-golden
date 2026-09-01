// ===== Sealed envelope cover -> hero transition =====
  const coverScreen = document.getElementById('cover-screen');
  const mainContent = document.getElementById('main-content');
  const enterBtn = document.getElementById('enterBtn');
  const backBtn = document.getElementById('backBtn');
  const coverEnvelope = document.getElementById('coverEnvelope');
  const heroSection = document.querySelector('.hero');
  const bodyEl = document.body;
  let coverOpening = false;

  function enterInvitation(){
    if(coverOpening) return;
    coverOpening = true;
    coverEnvelope.classList.add('activating');
    setTimeout(()=>{
      coverScreen.classList.add('opened');
    }, 1150);
    setTimeout(()=>{
      coverScreen.classList.add('hide');
      bodyEl.classList.remove('locked');
      window.scrollTo({top:0, behavior:'instant'});
      mainContent.classList.add('show');
      tryPlayHeroVideo();
      heroSection.classList.remove('hero-animate');
      void heroSection.offsetWidth;
      heroSection.classList.add('hero-animate');
    }, 1900);
  }

  function backToCover(){
    mainContent.classList.remove('show');
    heroSection.classList.remove('hero-animate');

    setTimeout(()=>{
      bodyEl.classList.add('locked');
      coverScreen.classList.remove('hide');
      coverScreen.classList.remove('light-burst');
      coverScreen.classList.remove('opened');
      coverEnvelope.classList.remove('activating');
      coverOpening = false;
      window.scrollTo({top:0, behavior:'instant'});
    }, 300);
  }

  enterBtn.addEventListener('click', enterInvitation);
  backBtn.addEventListener('click', backToCover);

  // ===== Ensure the hero background video actually plays =====
  const heroVideo = document.querySelector('.hero-video');
  function tryPlayHeroVideo(){
    if(!heroVideo) return;
    const p = heroVideo.play();
    if(p !== undefined){
      p.catch(()=>{
        const resume = () => { heroVideo.play(); };
        document.addEventListener('click', resume, {once:true});
        document.addEventListener('touchstart', resume, {once:true});
      });
    }
  }

  // ---------- Scratch reveal on the complete countdown card ----------
  (function(){
    const box = document.getElementById('countdown-card-reveal');
    const overlay = box && box.querySelector('.countdown-scratch');
    if(!box || !overlay) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    overlay.insertBefore(canvas, overlay.firstChild);
    let drawing = false;
    let revealed = false;
    let lastCheck = 0;

    function paint(){
      const rect = overlay.getBoundingClientRect();
      canvas.width = Math.max(1, Math.ceil(rect.width));
      canvas.height = Math.max(1, Math.ceil(rect.height));
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#dff3fa');
      gradient.addColorStop(.5, '#a9dff2');
      gradient.addColorStop(1, '#eef9fc');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(31,166,221,.14)';
      ctx.lineWidth = 1;
      for(let x = -canvas.height; x < canvas.width; x += 14){
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + canvas.height, canvas.height);
        ctx.stroke();
      }
    }

    function scratch(event){
      if(!drawing || revealed) return;
      const rect = canvas.getBoundingClientRect();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(event.clientX - rect.left, event.clientY - rect.top, 34, 0, Math.PI * 2);
      ctx.fill();
      const now = Date.now();
      if(now - lastCheck < 140) return;
      lastCheck = now;
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      let total = 0;
      for(let i = 3; i < pixels.length; i += 48){
        total++;
        if(pixels[i] < 40) clear++;
      }
      if(clear / total > .32){
        revealed = true;
        drawing = false;
        overlay.classList.add('revealed');
        box.classList.add('is-revealed');
        setTimeout(()=>{ overlay.hidden = true; }, 700);
      }
    }

    canvas.addEventListener('pointerdown', (event)=>{
      drawing = true;
      box.classList.add('scratch-started');
      canvas.setPointerCapture(event.pointerId);
      scratch(event);
    });
    canvas.addEventListener('pointermove', scratch);
    canvas.addEventListener('pointerup', ()=>{ drawing = false; });
    canvas.addEventListener('pointercancel', ()=>{ drawing = false; });
    window.addEventListener('resize', ()=>{ if(!revealed) paint(); });
    paint();
  })();

  // ---------- Scratch Cards on Program Cards ----------
  (function(){
    const cards = document.querySelectorAll('.program-card');

    cards.forEach((card) => {
      const overlay = card.querySelector('.card-scratch');
      if(!overlay) return;
      const canvas = document.createElement('canvas');
      overlay.insertBefore(canvas, overlay.firstChild);
      const ctx = canvas.getContext('2d');
      let revealed = false;
      let drawing = false;
      let lastCheck = 0;

      function size(){
        const rect = card.getBoundingClientRect();
        const w = Math.max(1, Math.ceil(rect.width));
        const h = Math.max(1, Math.ceil(rect.height));
        canvas.width = w;
        canvas.height = h;
        if(!revealed) paintCoating(w, h);
      }

      function paintCoating(w, h){
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#dff3fa');
        grad.addColorStop(0.5, '#a9dff2');
        grad.addColorStop(1, '#eef9fc');
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(31,166,221,0.16)';
        ctx.lineWidth = 1;
        for(let x = -h; x < w; x += 16){
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + h, h);
          ctx.stroke();
        }
      }

      function getPos(e){
        const rect = canvas.getBoundingClientRect();
        const p = e.touches ? e.touches[0] : e;
        return { x: p.clientX - rect.left, y: p.clientY - rect.top };
      }

      function scratchAt(x, y){
        card.classList.add('scratch-started');
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      function checkProgress(){
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let cleared = 0, total = 0;
        for(let i = 3; i < data.length; i += 4 * 12){
          total++;
          if(data[i] < 40) cleared++;
        }
        if(cleared / total > 0.32) reveal();
      }

      function reveal(){
        if(revealed) return;
        revealed = true;
        overlay.classList.add('revealed');
        card.classList.add('card-revealed');
        const flowers = ['&#10047;', '&#10048;', '&#10047;', '&#10048;', '&#10047;', '&#10048;', '&#10047;', '&#10048;', '&#10047;', '&#10048;', '&#10047;', '&#10048;'];
        flowers.forEach((flower, index)=>{
          const petal = document.createElement('span');
          const angle = (Math.PI * 2 * index / flowers.length) - Math.PI / 2;
          const distance = 105 + (index % 3) * 26;
          petal.className = 'flower-petal';
          petal.innerHTML = flower;
          petal.style.setProperty('--fx', `${Math.cos(angle) * distance}px`);
          petal.style.setProperty('--fy', `${Math.sin(angle) * distance}px`);
          petal.style.setProperty('--fr', `${index % 2 ? 190 : -170}deg`);
          petal.style.setProperty('--delay', `${(index % 4) * 0.04}s`);
          card.appendChild(petal);
          setTimeout(()=>{ petal.remove(); }, 1500);
        });
        setTimeout(()=>{ overlay.style.display = 'none'; }, 600);
      }

      function handleMove(e){
        if(!drawing || revealed) return;
        e.preventDefault();
        const pos = getPos(e);
        scratchAt(pos.x, pos.y);
        const now = Date.now();
        if(now - lastCheck > 180){
          lastCheck = now;
          checkProgress();
        }
      }

      canvas.addEventListener('pointerdown', (e) => {
        drawing = true;
        canvas.setPointerCapture(e.pointerId);
        handleMove(e);
      });
      canvas.addEventListener('pointerup', () => drawing = false);
      canvas.addEventListener('pointercancel', () => drawing = false);
      canvas.addEventListener('pointermove', handleMove);

      window.addEventListener('resize', size);
      size();
    });
  })();

  // ---------- Program route fills as the page scrolls ----------
  (function(){
    const section = document.getElementById('program-section');
    const route = document.getElementById('program-route-progress');
    const progressClip = document.getElementById('program-progress-clip-rect');
    const traveler = document.getElementById('program-route-traveler');
    const travelerHalo = document.getElementById('program-route-traveler-halo');
    const events = section ? [...section.querySelectorAll('.timeline-event')] : [];
    if(!section || !route || !traveler) return;

    const routeLength = route.getTotalLength();
    let ticking = false;

    function updateProgramRoute(){
      const rect = section.getBoundingClientRect();
      const routeRect = route.ownerSVGElement.getBoundingClientRect();
      const viewport = window.innerHeight;
      const distance = rect.height + viewport * .5;
      const progress = Math.min(1, Math.max(0, (viewport * .75 - rect.top) / distance));
      const travelled = routeLength * progress;
      const point = route.getPointAtLength(travelled);

      // Clip the bright route at the dot's exact SVG coordinate. Unlike a
      // dash offset, this remains aligned when the SVG stretches on mobile.
      if(progressClip) progressClip.setAttribute('height', String(Math.max(0, point.y)));
      traveler.setAttribute('cx', point.x);
      traveler.setAttribute('cy', point.y);

      // preserveAspectRatio="none" stretches the route SVG differently on
      // narrow screens. Counter-scale both ellipses so they stay true circles
      // in CSS pixels and fully cover the bright line beneath the moving dot.
      const scaleX = routeRect.width / 1000;
      const scaleY = routeRect.height / 1480;
      if(scaleX > 0 && scaleY > 0){
        traveler.setAttribute('rx', String(9 / scaleX));
        traveler.setAttribute('ry', String(9 / scaleY));
      }
      if(travelerHalo){
        travelerHalo.setAttribute('cx', point.x);
        travelerHalo.setAttribute('cy', point.y);
        if(scaleX > 0 && scaleY > 0){
          travelerHalo.setAttribute('rx', String(18 / scaleX));
          travelerHalo.setAttribute('ry', String(18 / scaleY));
        }
      }
      // Keep the glowing point visible at the beginning of the route as well.
      traveler.style.opacity = progress < .995 ? '1' : '0';
      if(travelerHalo) travelerHalo.style.opacity = progress < .995 ? '' : '0';
      events.forEach((event)=>{
        event.classList.toggle('is-active', progress + .045 >= Number(event.dataset.progress));
      });
      ticking = false;
    }

    function requestProgramUpdate(){
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(updateProgramRoute);
    }

    window.addEventListener('scroll', requestProgramUpdate, {passive:true});
    window.addEventListener('resize', requestProgramUpdate);
    updateProgramRoute();
  })();

  // ---------- Program cards reveal on viewport scroll (independent of route dot) ----------
  (function(){
    const cards = document.querySelectorAll('.program-timeline .timeline-event');
    if(!cards.length) return;

    if(!('IntersectionObserver' in window)){
      cards.forEach((card)=>card.classList.add('card-in-view'));
      return;
    }

    const cardObserver = new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(entry.isIntersecting){
          entry.target.classList.add('card-in-view');
          cardObserver.unobserve(entry.target);
        }
      });
    }, {threshold:.22, rootMargin:'0px 0px -12% 0px'});

    cards.forEach((card)=>cardObserver.observe(card));
  })();

  // ---------- Tap-to-open envelope invitation ----------
  (function(){
    const heading = document.querySelector('.envelope-heading-reveal');
    if(!heading) return;

    if(!('IntersectionObserver' in window)){
      heading.classList.add('heading-animate');
      return;
    }

    const headingObserver = new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(entry.isIntersecting){
          heading.classList.remove('heading-animate');
          void heading.offsetWidth;
          heading.classList.add('heading-animate');
        }else{
          heading.classList.remove('heading-animate');
        }
      });
    }, {threshold:.45});

    headingObserver.observe(heading);
  })();

  // ---------- Tap-to-open envelope invitation ----------
  (function(){
    const scene = document.getElementById('envelope-scene');
    if(!scene) return;
    let letterTimer;

    function toggleEnvelope(){
      const isOpen = scene.getAttribute('aria-expanded') === 'true';
      window.clearTimeout(letterTimer);

      if(isOpen){
        scene.classList.remove('letter-out');
      }

      scene.setAttribute('aria-expanded', String(!isOpen));
      scene.setAttribute('aria-label', isOpen ? 'Open the envelope' : 'Close the envelope');

      if(!isOpen){
        // Let the flap clear the letter before bringing it to the front.
        letterTimer = window.setTimeout(()=>{
          if(scene.getAttribute('aria-expanded') === 'true'){
            scene.classList.add('letter-out');
          }
        }, 420);
      }
    }

    scene.addEventListener('click', toggleEnvelope);
    scene.addEventListener('keydown', (event)=>{
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        toggleEnvelope();
      }
    });
  })();

  // ---------- Scroll Reveal ----------
  (function(){
    const items = document.querySelectorAll('.reveal, .reveal-stagger');
    if(!('IntersectionObserver' in window)){
      items.forEach(el => el.classList.add('in-view'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach(el => observer.observe(el));
  })();

  // Countdown
  const weddingDate = new Date("2026-09-16T15:00:00+05:00");
  function updateCountdown(){
    const now = new Date();
    let diff = weddingDate - now;
    if(diff < 0) diff = 0;
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    document.getElementById('cd-days').textContent = String(d).padStart(2,'0');
    document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
    document.getElementById('cd-mins').textContent = String(m).padStart(2,'0');
    document.getElementById('cd-secs').textContent = String(s).padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Wishes form — submits to Google Form, response saved in the linked Google Sheet
  const rsvpForm = document.getElementById('rsvp-form');
  rsvpForm.addEventListener('submit', function(){
    const relationship = document.getElementById('relationship');
    const wish = document.getElementById('wish');
    const details = document.getElementById('rsvp-details');
    if(details){
      details.value = [
        `Relationship: ${relationship ? relationship.value : ''}`,
        `Wish: ${wish ? wish.value : ''}`
      ].join('\n');
    }
    const successNote = document.getElementById('form-note');
    const formToReset = this;
    // form posts natively into the hidden iframe (no page reload, no CORS issue)
    setTimeout(()=>{
      successNote.classList.add('show');
      formToReset.reset();
    }, 700);
  });
