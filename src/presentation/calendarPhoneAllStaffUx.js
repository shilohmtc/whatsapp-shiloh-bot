function calendarPhoneAllStaffClientScript() {
  return `(()=>{'use strict';
if(innerWidth>700)return;
const strip=document.querySelector('.phone-week-staff-strip');
if(!strip)return;
const staffButtons=Array.from(strip.querySelectorAll('[data-phone-week-staff-id]'));
if(staffButtons.length<2)return;
const permittedIds=staffButtons.map(button=>String(button.dataset.phoneWeekStaffId||'')).filter(Boolean);
const renderedIds=new Set(staffButtons.filter(button=>button.dataset.phoneWeekStaffRendered==='true').map(button=>String(button.dataset.phoneWeekStaffId||'')));
const staffLabels=new Map(staffButtons.map(button=>[String(button.dataset.phoneWeekStaffId||''),button.textContent.trim()]));
const allButton=document.createElement('button');
allButton.type='button';
allButton.className='phone-week-staff-toggle phone-week-all-staff-toggle';
allButton.dataset.phoneWeekStaffAll='true';
allButton.textContent='All staff';
allButton.setAttribute('aria-pressed','false');
strip.prepend(allButton);
const columnHeader=document.createElement('div');
columnHeader.className='phone-all-staff-column-header';
columnHeader.dataset.phoneAllStaffColumnHeader='true';
columnHeader.setAttribute('aria-label','All staff columns');
strip.parentNode?.insertBefore(columnHeader,strip.nextSibling);
const style=document.createElement('style');
style.dataset.phoneAllStaffStyles='true';
style.textContent='@media(max-width:700px){.phone-week-all-staff-toggle{font-weight:900}.phone-week-all-staff-toggle.active{border-color:var(--leaf-deep);background:var(--leaf-deep);color:#fff}.phone-all-staff-column-header{display:none;margin-left:32px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff}.phone-all-staff-column-name{display:grid;place-items:center;min-width:0;min-height:32px;padding:3px 2px;border-right:1px solid var(--line);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink);font-size:.58rem;font-weight:850}.phone-all-staff-column-name:last-child{border-right:0}body[data-phone-all-staff="true"] .phone-all-staff-column-header{display:grid}body[data-phone-all-staff="true"] .workspace-main .week-view .time-column{position:relative!important}body[data-phone-all-staff="true"] .workspace-main .week-view .time-column:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;background:var(--phone-all-staff-columns);background-size:100% 100%}body[data-phone-all-staff="true"] .workspace-main .week-view .positioned-event{z-index:2!important}body[data-phone-all-staff="true"] .workspace-main .week-view .positioned-event .event-card{padding-left:3px!important;padding-right:3px!important}body[data-phone-all-staff="true"] .workspace-main .week-view .positioned-event .event-practitioners{display:inline-flex!important}body[data-phone-all-staff="true"] .workspace-main .week-view .positioned-event .event-practitioner-full{display:none!important}body[data-phone-all-staff="true"] .workspace-main .week-view .positioned-event .event-practitioner-compact{display:inline!important}}';
document.head.appendChild(style);
const allEvents=()=>Array.from(document.querySelectorAll('.week-view [data-week-date-lane] .positioned-event'));
const activeTimeColumn=()=>document.querySelector('.week-view [data-week-date-lane][data-phone-active-day="true"] .time-column')||document.querySelector('.week-view [data-week-date-lane] .time-column');
function urlAllMode(){return new URL(location.href).searchParams.get('phoneStaff')==='all';}
function allRendered(){return permittedIds.every(id=>renderedIds.has(id));}
function setLinkMode(node,enabled){if(!node||!node.getAttribute('href'))return;const url=new URL(node.getAttribute('href'),location.origin);if(enabled)url.searchParams.set('phoneStaff','all');else url.searchParams.delete('phoneStaff');node.setAttribute('href',url.pathname+'?'+url.searchParams.toString());}
function syncLinks(enabled){document.querySelectorAll('[data-phone-week-date],.phone-view-option,.phone-date-cell,.phone-today-action').forEach(node=>setLinkMode(node,enabled));document.querySelectorAll('.phone-staff-option').forEach(node=>setLinkMode(node,false));}
function renderColumns(){const count=permittedIds.length;columnHeader.style.gridTemplateColumns='repeat('+count+',minmax(0,1fr))';columnHeader.replaceChildren(...permittedIds.map(id=>{const node=document.createElement('span');node.className='phone-all-staff-column-name';node.dataset.phoneAllStaffStaffId=id;node.textContent=staffLabels.get(id)||('Staff '+id);return node;}));const stops=[];for(let index=1;index<count;index+=1){const pct=(index*100)/count;stops.push('transparent calc('+pct+'% - .5px),var(--line-strong) calc('+pct+'% - .5px),var(--line-strong) calc('+pct+'% + .5px),transparent calc('+pct+'% + .5px)');}const column=activeTimeColumn();if(column)column.style.setProperty('--phone-all-staff-columns',stops.length?'linear-gradient(to right,'+stops.join(',')+')':'none');}
function clearColumns(){columnHeader.replaceChildren();columnHeader.style.removeProperty('grid-template-columns');document.querySelectorAll('.week-view .time-column').forEach(column=>column.style.removeProperty('--phone-all-staff-columns'));}
function resetLayout(){document.body.dataset.phoneAllStaff='false';allButton.classList.remove('active');allButton.setAttribute('aria-pressed','false');allEvents().forEach(node=>{node.removeAttribute('data-phone-all-staff-visible');node.style.removeProperty('left');node.style.removeProperty('right');node.style.removeProperty('width');});clearColumns();syncLinks(false);}
function activateAll(){if(!allRendered())return false;document.body.dataset.phoneAllStaff='true';allButton.classList.add('active');allButton.setAttribute('aria-pressed','true');staffButtons.forEach(button=>{button.classList.remove('active');button.setAttribute('aria-pressed','false');});const count=permittedIds.length;allEvents().forEach(node=>{const card=node.querySelector('[data-event-staff-ids]');const ids=String(card?.dataset.eventStaffIds||'').split(',').filter(Boolean);const owner=ids.find(id=>permittedIds.includes(id));const index=Math.max(0,permittedIds.indexOf(owner));const left=(index*100)/count;const width=100/count;node.dataset.phoneStaffVisible='true';node.dataset.phoneAllStaffVisible='true';node.style.setProperty('left','calc('+left+'% + 1px)','important');node.style.setProperty('right','auto','important');node.style.setProperty('width','calc('+width+'% - 2px)','important');});renderColumns();const url=new URL(location.href);url.searchParams.set('phoneStaff','all');history.replaceState(null,'',url.pathname+'?'+url.searchParams.toString());syncLinks(true);return true;}
function reloadAll(){const url=new URL(location.href);url.searchParams.set('view','week');url.searchParams.delete('staff');permittedIds.forEach(id=>url.searchParams.append('staff',id));if(!url.searchParams.get('activeStaff'))url.searchParams.set('activeStaff',permittedIds[0]);url.searchParams.set('phoneStaff','all');location.assign(url.pathname+'?'+url.searchParams.toString());}
allButton.addEventListener('click',()=>{if(allRendered()){activateAll();return;}reloadAll();});
staffButtons.forEach(button=>button.addEventListener('click',()=>{if(!urlAllMode()&&document.body.dataset.phoneAllStaff!=='true')return;const url=new URL(location.href);url.searchParams.delete('phoneStaff');history.replaceState(null,'',url.pathname+'?'+url.searchParams.toString());resetLayout();},true));
if(urlAllMode()){if(allRendered())activateAll();else reloadAll();}
})();`;
}

module.exports = {
  calendarPhoneAllStaffClientScript,
};
