export function rankCheckinsByFilterPriority(checkins, filters, priorityList) {
  return checkins.reduce((score, checkin) => {
    let matchScore = 0;
    priorityList.forEach((key, index) => {
      if (!filters[key]) return;
      const checkinValue = checkin[key]?.toLowerCase();
      const filterValue = filters[key]?.toLowerCase();
      if (checkinValue === filterValue) {
        matchScore += (priorityList.length - index); // Higher priority => higher score
      }
    });
    return score + matchScore;
  }, 0);
}
