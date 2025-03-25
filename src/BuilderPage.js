import { BuilderComponent, builder } from '@builder.io/react';

// Optional: Only needed if builder.init is NOT already done in builder-settings.js
// builder.init('YOUR_API_KEY'); 

function BuilderPage({ model = 'page' }) {
  return (
    <BuilderComponent
      model={model}
      options={{ noCache: true }} // 👈 this disables caching for dev
    />
  );
}

export default BuilderPage;
