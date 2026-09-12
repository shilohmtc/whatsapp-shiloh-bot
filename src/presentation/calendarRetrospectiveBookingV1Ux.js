const base = require('./calendarRetrospectiveBookingUx');

function renderCalendarRetrospectiveBookingPage(options = {}) {
  let html = base.renderCalendarRetrospectiveBookingPage(options);
  html = html.replace(
    '<div class="field"><label for="past-service">Treatment</label><select id="past-service"><option value="">Choose treatment</option></select></div>',
    '<div class="field"><label for="past-service">Treatment</label><select id="past-service"><option value="">Choose treatment</option><option value="custom">Custom service</option></select></div><div class="field" data-custom-service-field hidden><label for="past-custom-service">Custom service</label><input id="past-custom-service" type="text" maxlength="120" placeholder="Historical service name"><span class="guard">Saved only on this historical appointment. It does not create a Shiloh service or catalogue entry.</span></div>',
  );
  html = html.replace(
    '<button class="button secondary" type="button" data-edit-past>Edit</button>',
    '<button class="button secondary" type="button" data-edit-past>Edit</button><button class="button secondary" type="button" data-add-past hidden>Add New Appointment</button>',
  );
  return html;
}

function calendarRetrospectiveBookingClientScript() {
  const source = base.calendarRetrospectiveBookingClientScript();
  return source
    .replace(
      "function service(){var id=Number(q('#past-service').value);return(options.services||[]).find(function(x){return Number(x.id)===id})||null}",
      "function customSelected(){return q('#past-service').value==='custom'}function service(){if(customSelected())return{id:null,name:q('#past-custom-service').value.trim(),durationMinutes:0,staffIds:(options.staff||[]).map(function(p){return Number(p.id)})};var id=Number(q('#past-service').value);return(options.services||[]).find(function(x){return Number(x.id)===id})||null}",
    )
    .replace(
      "function refreshStaff(){var s=service(),n=q('#past-staff');n.innerHTML='<option value=\"\">Choose practitioner</option>';if(!s){n.disabled=true;return}(options.staff||[]).filter(function(p){return(s.staffIds||[]).map(Number).includes(Number(p.id))}).forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.displayName;n.appendChild(o)});n.disabled=false}",
      "function refreshStaff(){var s=service(),n=q('#past-staff');n.innerHTML='<option value=\"\">Choose practitioner</option>';if(!s){n.disabled=true;return}(options.staff||[]).filter(function(p){return customSelected()||(s.staffIds||[]).map(Number).includes(Number(p.id))}).forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.displayName;n.appendChild(o)});n.disabled=false}",
    )
    .replace(
      "function payload(){return{clientId:selectedClient&&selectedClient.id,staffId:Number(q('#past-staff').value),serviceId:Number(q('#past-service').value),startsAt:iso(q('#past-date').value,q('#past-start').value),endsAt:iso(q('#past-date').value,q('#past-end').value),notes:q('#past-notes').value}}",
      "function payload(){var custom=customSelected();return{clientId:selectedClient&&selectedClient.id,staffId:Number(q('#past-staff').value),serviceId:custom?null:Number(q('#past-service').value),customServiceName:custom?q('#past-custom-service').value.trim():null,startsAt:iso(q('#past-date').value,q('#past-start').value),endsAt:iso(q('#past-date').value,q('#past-end').value),notes:q('#past-notes').value}}",
    )
    .replace(
      "q('#past-service').addEventListener('change',function(){refreshStaff();q('#past-end').value='';defaultEnd()});",
      "q('#past-service').addEventListener('change',function(){var custom=customSelected();q('[data-custom-service-field]').hidden=!custom;q('#past-custom-service').required=custom;refreshStaff();q('#past-end').value='';defaultEnd()});",
    )
    .replace(
      "status('Past appointment #'+b.appointmentId+' recorded. No client message was sent.','ready');q('[data-record-past]').disabled=true",
      "status('Past appointment #'+b.appointmentId+' recorded. No client message was sent.','ready');q('[data-record-past]').disabled=true;q('[data-add-past]').hidden=false",
    )
    .replace(
      "refreshServices();})();",
      "q('[data-add-past]').addEventListener('click',function(){window.location.reload()});refreshServices();})();",
    );
}

module.exports = { renderCalendarRetrospectiveBookingPage, calendarRetrospectiveBookingClientScript };
