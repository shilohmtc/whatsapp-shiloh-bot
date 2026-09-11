'use strict';

// Clinic-owned stable policy/FAQ authority for facts that are not already owned
// by transactional Shiloh services. Do not add prices, availability, booking
// state, practitioner eligibility, client data, or changing third-party facts.
//
// `confirmed` entries may answer directly. `unconfirmed` entries intentionally
// fail closed until the clinic owner supplies an approved policy answer.
const CLINIC_FAQ_POLICY = Object.freeze([
  Object.freeze({
    id: 'professional-conduct',
    status: 'confirmed',
    title: 'Professional treatment conduct',
    topics: Object.freeze(['professional', 'sexual', 'happy ending', 'inappropriate', 'conduct']),
    aliases: Object.freeze([
      'is the massage sexual',
      'do you do happy endings',
      'happy ending',
      'is it professional',
      'what behaviour is allowed',
    ]),
    answer: 'Shiloh services are strictly professional and non-sexual. Inappropriate comments, requests or behaviour can end the session; the session remains payable, and future appointments may be refused.',
    provenance: 'Owner-provided clinic policy retained 2026-08-18',
  }),
  Object.freeze({
    id: 'refreshments-cooldrinks',
    status: 'unconfirmed',
    title: 'Refreshments and cooldrinks',
    topics: Object.freeze(['refreshment', 'refreshments', 'cooldrink', 'cooldrinks', 'cool drink', 'cold drink', 'drink', 'drinks', 'beverage', 'beverages', 'soda', 'soft drink']),
    aliases: Object.freeze([
      'do you have cooldrinks',
      'do you have drinks',
      'can i get something to drink',
      'do u have cold drinks',
    ]),
    answer: null,
    provenance: null,
  }),
  Object.freeze({
    id: 'snacks',
    status: 'unconfirmed',
    title: 'Snacks and light food',
    topics: Object.freeze(['snack', 'snacks', 'food', 'nibbles', 'bite', 'bites']),
    aliases: Object.freeze([
      'do you have snacks',
      'is there food',
      'can i get a snack',
      'got any nibbles',
    ]),
    answer: null,
    provenance: null,
  }),
  Object.freeze({
    id: 'champagne-alcohol',
    status: 'unconfirmed',
    title: 'Champagne and alcoholic drinks',
    topics: Object.freeze(['champagne', 'champers', 'bubbly', 'prosecco', 'alcohol', 'wine']),
    aliases: Object.freeze([
      'do you serve champagne',
      'can we have bubbly',
      'is champers included',
      'do u have champagne',
    ]),
    answer: null,
    provenance: null,
  }),
  Object.freeze({
    id: 'companions',
    status: 'unconfirmed',
    title: 'Companions and visitors',
    topics: Object.freeze(['companion', 'companions', 'friend', 'friends', 'partner', 'partners', 'boyfriend', 'girlfriend', 'husband', 'wife', 'mate', 'visitor', 'visitors', 'come with me', 'bring someone']),
    aliases: Object.freeze([
      'can my friend come with me',
      'can i bring my partner',
      'can my mate come along',
      'may someone wait with me',
    ]),
    answer: null,
    provenance: null,
  }),
]);

const FAQ_UNKNOWN_REPLY = 'I do not have a maintained Shiloh policy for that yet, and I do not want to guess. Please ask the clinic team to confirm.';

module.exports = {
  CLINIC_FAQ_POLICY,
  FAQ_UNKNOWN_REPLY,
};
