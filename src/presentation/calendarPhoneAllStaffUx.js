function calendarPhoneAllStaffClientScript() {
  return `(()=>{'use strict';
if(innerWidth>700)return;
const strip=document.querySelector('.phone-week-staff-strip');
if(!strip)return;
const staffButtons=Array.from(strip.querySelectorAll('[data-phone-week-staff-id]'));
if(staffButtons.length<2)return;
const permittedIds=staffButtons.map(button=>String(button.dataset.phoneWeekStaffId||'')).filter(Boolean);
const renderedIds=new Set(staffButtons.filter(button=>button.dataset.phoneWeekStaffRendered==='true').map(button=>String(button.dataset.phoneWeekStaffId||'')));
const allButton=document.createElement('button');
allButton.type='button';
allButton.className='phone-week-staff-toggle phone-week-all-staff-toggle';
allButton.dataset.phoneWeekStaffAll='true';
allButton.textContent='All staff';
allButton.setAttribute('aria-pressed','false');
strip.prepend(allButton);
const style=document.createElement('style');
style.dataset.phoneAllStaffStyles='true';
style.textContent='@media(max-width:700px){.phone-week-all-staff-toggle{font-weight:900}.phone-week-all-staff-toggle.active{border-color:var(--leaf-deep);background:var(--leaf-deep);color:#fff}body[data-phone-all-staff="true"] .workspace-main .week-view .positioned-event .event-card{padding-left:3px!important;padding-right:3px!important}body[data-phone-all-staff="true"] .workspace-main .week-view .positioned-event .event-practitioners{display:inline-flex!important}body[data-phone-all-staff="true"] .workspace-main .week-view .positioned-event .event-practitioner-full{display:none!important}body[data-phone-all-staff="true"] .workspace-main .week-view .positioned-event .event-practitioner-compact{display:inline!important}}';
document.head.appendChild(style);
const allEvents=()=>Array.from(document.querySelectorAll('.week-view [data-week-date-lane] .positioned-event'));
function urlAllMode(){return new URL(location.href).searchParams.get('phoneStaff')==='all';}
function allRendered(){return permittedIds.every(id=>renderedIds.has(id));}
function setLinkMode(node,enabled){if(!node||!node.getAttribute('href'))return;const url=new URL(node.getAttribute('href'),location.origin);if(enabled)url.searchParams.set('phoneStaff','all');else url.searchParams.delete('phoneStaff');node.setAttribute('href',url.pathname+'?'+url.searchParams.toString());}
function syncLinks(enabled){document.querySelectorAll('[data-phone-week-date],.phone-view-option,.phone-date-cell,.phone-today-action').forEach(node=>setLinkMode(node,enabled));document.querySelectorAll('.phone-staff-option').forEach(node=>setLinkMode(node,false));}
function resetLayout(){document.body.dataset.phoneAllStaff='false';allButton.classList.remove('active');allButton.setAttribute('aria-pressed','false');allEvents().forEach(node=>{node.removeAttribute('data-phone-all-staff-visible');node.style.removeProperty('left');node.style.removeProperty('right');node.style.removeProperty('width');});syncLinks(false);}
function activateAll(){if(!allRendered())return false;document.body.dataset.phoneAllStaff='true';allButton.classList.add('active');allButton.setAttribute('aria-pressed','true');staffButtons.forEach(button=>{button.classList.remove('active');button.setAttribute('aria-pressed','false');});const count=permittedIds.length;allEvents().forEach(node=>{const card=node.querySelector('[data-event-staff-ids]');const ids=String(card?.dataset.eventStaffIds||'').split(',').filter(Boolean);const owner=ids.find(id=>permittedIds.includes(id));const index=Math.max(0,permittedIds.indexOf(owner));node.dataset.phoneStaffVisible='true';node.dataset.phoneAllStaffVisible='true';node.style.setProperty('left','calc('+index+' * (100% / '+count+') + 1px)','important');node.style.setProperty('right','auto','important');node.style.setProperty('width','calc((100% / '+count+') - 2px)','important');});const url=new URL(location.href);url.searchParams.set('phoneStaff','all');history.replaceState(null,'',url.pathname+'?'+url.searchParams.toString());syncLinks(true);return true;}
function reloadAll(){const url=new URL(location.href);url.searchParams.set('view','week');url.searchParams.delete('staff');permittedIds.forEach(id=>url.searchParams.append('staff',id));if(!url.searchParams.get('activeStaff'))url.searchParams.set('activeStaff',permittedIds[0]);url.searchParams.set('phoneStaff','all');location.assign(url.pathname+'?'+url.searchParams.toString());}
allButton.addEventListener('click',()=>{if(allRendered()){activateAll();return;}reloadAll();});
staffButtons.forEach(button=>button.addEventListener('click',()=>{if(!urlAllMode()&&document.body.dataset.phoneAllStaff!=='true')return;const url=new URL(location.href);url.searchParams.delete('phoneStaff');history.replaceState(null,'',url.pathname+'?'+url.searchParams.toString());resetLayout();},true));
if(urlAllMode()){if(allRendered())activateAll();else reloadAll();}
})();`;
}

module.exports = {
  calendarPhoneAllStaffClientScript,
};
