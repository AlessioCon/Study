import { Link } from "react-router-dom";


function Home(){
    return(
        <main>
            <h1>Home</h1>
            <Link to='/corsi'>i nostri corsi</Link>
        </main>

    )
}

export default Home;