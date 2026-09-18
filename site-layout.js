// Environment-aware family navigation; production destinations remain canonical.
if(location.hostname.includes('.stg.')){
 const hosts={'bringmesunshinegroup.com':'bmsg-public.stg.bringmesunshinegroup.com','onegooddeed.com':'ogd-public.stg.bringmesunshinegroup.com','ourfamilyrocks.com':'ofr-public.stg.bringmesunshinegroup.com','learntoreadreadtolearn.com':'ltr-public.stg.bringmesunshinegroup.com'};
 document.querySelectorAll('a[href]').forEach(a=>{
  const u=new URL(a.href);const h=u.hostname.replace(/^www\./,'');
  if(hosts[h]){u.hostname=hosts[h];u.protocol='https:';a.href=u.href;}
  if(u.hostname==='buy.stripe.com'||u.hostname==='shop.onegooddeed.com'){
   a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.textContent=u.hostname==='buy.stripe.com'?'Payments unavailable in staging':'Shop unavailable in staging';
  }
 });
}
