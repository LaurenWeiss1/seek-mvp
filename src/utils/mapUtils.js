// utils/mapUtils.js

export function generateGeoJSONFromCheckins(checkins) {
    return {
      type: 'FeatureCollection',
      features: checkins
        .filter(ci => typeof ci.lat === 'number' && typeof ci.lng === 'number' && !isNaN(ci.lat) && !isNaN(ci.lng))
        .map((ci) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [ci.lng, ci.lat],
          },
          properties: {
            ...ci,
            intensity: 1,
          },
        })),
    };
  }
  
  
  export function getEmojiForBarType(type) {
    switch (type) {
      case 'club': return '🪩';
      case 'cocktail': return '🍸';
      case 'dive': return '🍺';
      case 'wine': return '🍷';
      default: return '🍻';
    }
  }
  
  export function getPopupContent(bar, checkins, userProfile, mode, filters) {
    const barCheckins = checkins.filter(ci => ci.barId === bar.id);
    const total = barCheckins.length;
  
    const avgAge = total ? (barCheckins.reduce((sum, ci) => sum + ci.age, 0) / total).toFixed(1) : '—';
    const genderRatio = calculateGenderRatio(barCheckins);
  
    let matchInsights = '';
    if (mode === 'match' && userProfile) {
      const matched = barCheckins.filter(ci => {
        const ageOk = ci.age >= filters.ageRange[0] && ci.age <= filters.ageRange[1];
        const genderOk = filters.gender === 'all' || ci.gender === filters.gender;
        const orientationOk = filters.orientation === 'all' || ci.orientation === filters.orientation;
        const collegeOk = filters.college === 'all' || ci.college === filters.college;
        return ageOk && genderOk && orientationOk && collegeOk;
      });
      matchInsights = `<br/><strong>${matched.length}</strong> match your filters`;
    }
  
    const image = bar.imageUrl || 'https://via.placeholder.com/100x70?text=Bar';
    const website = bar.website ? `<a href="${bar.website}" target="_blank">Visit Website</a><br/>` : '';
  
    return `
      <div style="min-width: 200px">
        <strong style="font-size: 16px">${bar.name}</strong><br/>
        <img src="${image}" alt="${bar.name}" style="width: 100%; height: auto; border-radius: 6px; margin: 6px 0" />
        ${website}
        <strong>Check-ins:</strong> ${total}<br/>
        <strong>Avg Age:</strong> ${avgAge}<br/>
        <strong>Gender Ratio (M/F):</strong> ${genderRatio}
        ${matchInsights}
      </div>
    `;
  }
  
  function calculateGenderRatio(checkins) {
    const male = checkins.filter(ci => ci.gender === 'male').length;
    const female = checkins.filter(ci => ci.gender === 'female').length;
    return `${male}/${female}`;
  }
  