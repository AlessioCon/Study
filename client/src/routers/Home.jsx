import { Link } from "react-router-dom";
import env from "react-dotenv";

import 'dotenv/config'


function Home(){
    return(
        <main>
            <h1>Home</h1>
            <p>env = {env.URL_SERVER}</p>
            <p>un altra prova = {process.env.URL_SERVER}</p>
            <Link to='/corsi'>i nostri corsi</Link>
        </main>

    )
}

export default Home;