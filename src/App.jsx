import './App.css'
import GameScene from './scenes/GameScene'

function App() {
  const consoleOptions = 'background: #ffffff; color: #6b17e8';
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
    '%c D|||||||||||||||||||||||||D          D|||||||||D                      DDD|||||||||||||||DDD       D||||||||D    \n' +
    '%c  DDDDDDDDDDDDDDDDDDDDDDDDD           DDDDDDDDDDD                         DDDDDDDDDDDDDDD          DDDDDDDDDD               \n' +      
    '%c==============================================================================================================',
    ...Array(17).fill(consoleOptions)
  );

  return (
    <>
      <div className="wrapper">
        <GameScene />
      </div>
    </>
  )
}


export default App
