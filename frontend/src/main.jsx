import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


const consoleOptions = 'background:rgb(0, 3, 22); color:rgb(112, 192, 230)';
console.log(
  '%c=============================================================================================================+  \n' +
  '%c  DDDDDDDDDDDDDDDDDDDDDDDDD                                                                         DDDDDDDD         \n' +
  '%c D|||||||||||||||||||||||||D                                                                       D||||||||D               \n' +
  '%c D|||||||||||||||||||||||||DD                                                                       DDDDDDDD        \n' +
  '%c DDD||||||||DDDDDDDD||||||||DDD                                                                                    \n' +
  '%c   D||||||||D      DDD||||||||DDD     DDDDDDDD   DDDDDDDDD                DDDDDDDDDDDDDDD           DDDDDDDD           \n' +
  '%c   D||||||||D        DDD||||||||DD   D||||||||DDD|||||||||DDD          DDD|||||||||||||||DDD       D||||||||D   \n' +
  '%c   D||||||||D          DD||||||||D   D|||||||||||||||||||||||DDD     DD||||||||||||||||||||DDDD    D||||||||D             \n' +
  '%c   D||||||||D           D||||||||D   D|||||||||||DDDDDD||||||||DD   D|||||||||||DDDDDD||||||||DD   D||||||||D       \n' +
  '%c   D||||||||D           D||||||||D    DD|||||||DDD    DD||||||||D   D||||||||DDD     DD||||||||D    D||||||D  \n' +
  '%c   D||||||||D           D||||||||D     D|||||||D       DDDDDDDDD    D||||||||D        D||||||||D    D||||||D              \n' +
  '%c   D||||||||D          DD||||||||D     D|||||||D                    D|||||||||DDDDDDDD|||||||||D    D||||||D               \n' +
  '%c   D||||||||D         DD||||||||DD     D|||||||D                    D|||||||||||||||||||||||||D     D||||||D         \n' +
  '%c   D||||||||D       DD||||||||DDD      D|||||||D                    D|||||||DDDDDDDDDDDDDDDDDD      D||||||D                           \n' +
  '%c   D||||||||D      D||||||||DDD        D|||||||D                    D|||||||D                       D||||||D     \n' +
  '%c DDD||||||||DDDDDDDD||||||||DDD        D|||||||D                    D|||||||DDDDDDDDDDDDDDDDDD      D||||||D                  \n' +
  '%c D|||||||||||||||||||||||||DD         DD|||||||DD                    DD||||||||||||||||||||DDDD     D||||||D            \n' +
  ' D|||||||||||||||||||||||||D          D|||||||||D                     DDD||||||||||||||||DDD       D||||||||D    \n' +
  ' DDDDDDDDDDDDDDDDDDDDDDDDD            DDDDDDDDDDD                        DDDDDDDDDDDDDDDD          DDDDDDDDDD               \n' +      
  ' ==============================================================================================================',
  ...Array(17).fill(consoleOptions)
);
console.log("%cVisit my site: https://dreiabmab.com", "background-color: black; color: lightblue; text-decoration: underline; padding: 5px;");


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
