export const SOURCE_LABELS = {
  join:                'New Lead',
  tour:                'Tour Request',
  booking:             'Booking',
  training_assessment: 'TA Request',
  nasm_partnership:    'NASM Certification',
  checkin_app:         'Check-in App',
  classpass:           'ClassPass',
}

export function getSourceLabel(source) {
  return SOURCE_LABELS[source] ?? source
}
