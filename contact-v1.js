// Forms browser client v1.0.0; vendored with each independently released site.
(async()=>{
  const form=document.querySelector('[data-contact-form]');if(!form)return;
  const status=form.querySelector('[role="status"]'),button=form.querySelector('button[type="submit"]');
  let endpoint; const brand=form.dataset.brand;
  try { const response=await fetch('/contact-config.json'); if(!response.ok)throw new Error(); endpoint=(await response.json()).forms_endpoint;  } catch { status.textContent='The contact service is temporarily unavailable.';button.disabled=true;return; }
  let widget,token='',key=crypto.randomUUID(),lastPayload='',busy=false,accepted=false,rejected=false,receiptGeneration=0,checkButton;
  const emailFormat=/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
  const say=text=>{status.textContent=text;};
  async function trackReceipt(receipt){
    const generation=++receiptGeneration;checkButton?.remove();
    const check=document.createElement('button');check.type='button';check.textContent='Check message status';check.hidden=true;status.after(check);checkButton=check;
    const refresh=async()=>{
      const response=await fetch(`${endpoint}/api/v1/forms/submissions/${receipt.submission_id}/status`,{headers:{authorization:`Bearer ${receipt.receipt_token}`},signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw new Error('status_unavailable');const result=await response.json();
      if(generation!==receiptGeneration)return true;
      if(result.status==='delivered'){
        receiptGeneration++;check.remove();token='';
        window.turnstile?.remove?.(widget);
        const confirmation=document.createElement('section');confirmation.setAttribute('role','status');confirmation.tabIndex=-1;confirmation.dataset.deliveryConfirmation='';
        const heading=document.createElement('h2');heading.textContent='Message delivered';
        const detail=document.createElement('p');detail.textContent='Your message has reached our support team. This confirms delivery, not that a reply has been sent.';
        const reference=document.createElement('p');reference.textContent='Reference: '+receipt.submission_id+'. Keep this reference if you contact us about your message.';
        confirmation.append(heading,detail,reference);form.replaceWith(confirmation);confirmation.focus();return true;
      }
      status.classList.toggle('screening-warning',['blocked','review'].includes(result.status));
      for(const name of ['name','email','message','kind'])form.elements[name].classList.toggle('screening-field',(result.flagged_fields||[]).includes(name));
      rejected=result.status==='blocked';
      const labels={name:'Your name',email:'Email for a reply',message:'Your message',kind:'Message type'};
      const flaggedLabels=(result.flagged_fields||[]).filter(f=>labels[f]).map(f=>labels[f]);
      say(`${result.message}${result.reason?" Reason: "+result.reason:""}${rejected?(flaggedLabels.length?" Field to review: "+flaggedLabels.join(", ")+". Edit the highlighted field and submit again.":" Screening did not identify a specific field, so none is highlighted. Review the wording or quote the reference to request a human review.")+" Automated screening can make mistakes.":""} Reference: ${receipt.submission_id}. Keep this reference and quote it to support when asking about this message.`);
      button.textContent={checking:'Checking message…',accepted:'Message accepted',review:'Awaiting review',blocked:'Message not forwarded',delivered:'Message delivered'}[result.status]||'Message saved';
      return ['review','blocked','delivered'].includes(result.status);
    };
    check.addEventListener('click',async()=>{check.disabled=true;try{await refresh();}catch{say(`Your message is saved, but its latest status is unavailable. Do not resubmit. Reference: ${receipt.submission_id}`);}finally{check.disabled=false;}});
    try{
      for(let attempt=0;attempt<80;attempt++){
        if(await refresh())return;
        await new Promise(resolve=>setTimeout(resolve,1500));
      }
      say(`Your message is saved and still processing. Use Check message status; do not resubmit. Reference: ${receipt.submission_id}`);
    }catch{say(`Your message is saved, but its latest status is unavailable. Use Check message status; do not resubmit. Reference: ${receipt.submission_id}`);}
    finally{if(generation===receiptGeneration)check.hidden=false;}
  }
  const fields=['name','email','message'];
  for(const name of fields){
    const input=form.elements[name];
    input.addEventListener('input',()=>{
      if(name==='email')input.setCustomValidity('');
      if(rejected){rejected=false;accepted=false;receiptGeneration++;checkButton?.remove();token='';window.turnstile?.reset(widget);button.textContent='Submit edited message';button.disabled=true;status.classList.remove('screening-warning');say('Your draft is preserved. Finish editing and complete the security check to submit again.');}
      input.classList.remove('screening-field');input.removeAttribute('aria-invalid');document.getElementById(input.getAttribute('aria-describedby')).textContent='';});
  }
  form.elements.kind.addEventListener('change',()=>{if(rejected)form.elements.message.dispatchEvent(new Event('input'));});
  button.disabled=true;
  try{
    const response=await fetch(endpoint+'/api/v1/forms/config',{signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new Error();const cfg=await response.json();

    for(const link of document.querySelectorAll('[data-contact-legal]'))link.href=(cfg.environment==='production'?'https://bringmesunshinegroup.com':'https://bmsg-public.stg.bringmesunshinegroup.com')+'/'+link.dataset.contactLegal+'.html#contact-messages';
    if(!cfg.site_key)throw new Error();
    await new Promise((resolve,reject)=>{
      if(window.turnstile)return resolve();
      const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=resolve;script.onerror=reject;document.head.append(script);
    });
    widget=window.turnstile.render(form.querySelector('[data-challenge]'),{sitekey:cfg.site_key,action:'contact',size:'flexible',appearance:'interaction-only',callback:v=>{token=v;if(!accepted&&!busy)button.disabled=false;},'expired-callback':()=>{token='';button.disabled=true;},'error-callback':()=>{token='';button.disabled=true;say('The security check could not load. Your text is still here. Reload when ready.');}});
    say('Complete the security check, then send your message.');
  }catch{say('The contact service is temporarily unavailable. Your text stays here. Please try again later.');}
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||accepted)return;
    form.elements.email.setCustomValidity(emailFormat.test(form.elements.email.value.trim())?'':'Enter a complete email address, for example name@example.com.');
    let first;
    for(const name of fields){const field=form.elements[name];const error=document.getElementById(field.getAttribute('aria-describedby'));if(!field.checkValidity()){field.setAttribute('aria-invalid','true');error.textContent=field.validationMessage;first??=field;}}
    if(first){say('Please check the highlighted fields.');first.focus();return;}
    if(!token){say('Please complete the security check.');return;}
    const payload={brand,kind:form.elements.kind.value,name:form.elements.name.value.trim(),email:form.elements.email.value.trim(),message:form.elements.message.value.trim(),website:form.elements.website.value};
    const fingerprint=JSON.stringify(payload);if(lastPayload&&lastPayload!==fingerprint)key=crypto.randomUUID();lastPayload=fingerprint;
    busy=true;button.disabled=true;status.classList.remove('screening-warning');for(const name of ['name','email','message','kind'])form.elements[name].classList.remove('screening-field');say('Sending your message…');
    try{
      let response;
      for(let attempt=0;attempt<2;attempt++){
        try{response=await fetch(endpoint+'/api/v1/forms/submissions',{method:'POST',headers:{'content-type':'application/json','idempotency-key':key},body:JSON.stringify({...payload,turnstile_token:token}),signal:AbortSignal.timeout(15000)});break;}
        catch(e){if(attempt===1)throw e;}
      }
      const result=await response.json();
      if(response.status!==202||!result.submission_id)throw new Error(result.error==='rate_limited'?'Please wait before trying again.':'We could not confirm receipt. Your text is still here. Please try again.');
      accepted=true;button.textContent='Message received';say(`${result.message} Reference: ${result.submission_id}`);
      status.tabIndex=-1;status.focus();
      if(result.receipt_token)void trackReceipt(result);
    }catch(e){say(e.message.startsWith('Please')||e.message.startsWith('We could')?e.message:'We could not confirm receipt. Your text is still here. Please try again.');token='';window.turnstile?.reset(widget);}
    finally{busy=false;if(!accepted)button.disabled=!token;}
  });
})();
