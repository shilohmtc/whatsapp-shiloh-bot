function calendarCreateBookingClientChoiceScript() {
  return `(function(){
'use strict';
var search=document.getElementById('client-search');
if(!search)return;
var field=search.closest('.field.wide');
if(!field)return;
var searchLabel=field.querySelector('label[for="client-search"]');
var searchActions=search.parentElement;
var results=field.querySelector('[data-client-results]');
var selected=field.querySelector('[data-selected-client]');
var newPanel=field.querySelector('[data-new-client-panel]');
var useNew=field.querySelector('[data-select-new-client]');
var newName=document.getElementById('new-client-name');
var review=document.querySelector('[data-review-booking]');
var status=document.querySelector('[data-booking-status]');
if(!searchLabel||!searchActions||!results||!newPanel)return;
var modeHeading=document.createElement('div');
modeHeading.className='hint';
modeHeading.textContent='Client';
modeHeading.style.fontWeight='750';
modeHeading.style.fontSize='.82rem';
var modeActions=document.createElement('div');
modeActions.className='actions';
modeActions.style.marginTop='6px';
modeActions.setAttribute('role','group');
modeActions.setAttribute('aria-label','Choose client type');
var existingButton=document.createElement('button');
existingButton.type='button';
existingButton.className='button';
existingButton.textContent='Find client';
existingButton.setAttribute('data-client-mode-existing','');
existingButton.setAttribute('aria-pressed','true');
var newButton=document.createElement('button');
newButton.type='button';
newButton.className='button secondary';
newButton.textContent='New client';
newButton.setAttribute('data-client-mode-new','');
newButton.setAttribute('aria-pressed','false');
modeActions.appendChild(existingButton);
modeActions.appendChild(newButton);
var existingPanel=document.createElement('div');
existingPanel.setAttribute('data-existing-client-panel','');
field.insertBefore(modeHeading,searchLabel);
field.insertBefore(modeActions,searchLabel);
field.insertBefore(existingPanel,searchLabel);
existingPanel.appendChild(searchLabel);
existingPanel.appendChild(searchActions);
existingPanel.appendChild(results);
searchLabel.textContent='Search CRM V2';
function setStatus(message){if(!status)return;status.textContent=message;status.classList.remove('error','ready','warn');}
function clearVisibleSelection(){if(!selected)return;selected.hidden=true;selected.textContent='';}
function setMode(mode,preserveSelection){var isNew=mode==='new';existingPanel.hidden=isNew;newPanel.hidden=!isNew;existingButton.className=isNew?'button secondary':'button';newButton.className=isNew?'button':'button secondary';existingButton.setAttribute('aria-pressed',isNew?'false':'true');newButton.setAttribute('aria-pressed',isNew?'true':'false');if(!preserveSelection)window.dispatchEvent(new CustomEvent('calendar-client-mode',{detail:{mode:mode}}));}
existingButton.addEventListener('click',function(){clearVisibleSelection();if(review)review.disabled=true;setMode('existing');setStatus('Search CRM V2 by client name or mobile number, then explicitly select one result.');search.focus();});
newButton.addEventListener('click',function(){clearVisibleSelection();if(review)review.disabled=true;setMode('new');setStatus('Enter the new client’s name and South African mobile number. Exact mobile is the only automatic CRM V2 identity key.');if(newName)newName.focus();});
if(useNew)useNew.addEventListener('click',function(){window.setTimeout(function(){if(selected&&!selected.hidden&&selected.textContent.indexOf('New client')===0){setMode('new',true);if(review)review.disabled=false;}},0);});
results.addEventListener('click',function(event){var target=event.target.closest?event.target.closest('.client-result'):null;if(!target)return;window.setTimeout(function(){if(selected&&!selected.hidden&&selected.textContent.indexOf('CRM V2 #')!==-1){setMode('existing',true);if(review)review.disabled=false;}},0);});
setMode('existing');
})();`;
}

module.exports = {
  calendarCreateBookingClientChoiceScript,
};
