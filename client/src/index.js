import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App'


console.log(process.env.URL_SERVER)


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <App/>
);

