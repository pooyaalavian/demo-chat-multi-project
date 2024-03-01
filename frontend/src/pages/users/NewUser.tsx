import { BaseSyntheticEvent } from "react";
import { createTopic, createUser } from "../../api/internal";



export const NewUser = () => {

    const handleSubmit = async (event: BaseSyntheticEvent) => {
        event.preventDefault();
        console.log(event);
        const name = event.target.querySelector('#name').value;
        const email = event.target.querySelector('#email').value;
        const body = { name, email };
        const res = await createUser(body);
        console.log(res);
        localStorage.setItem('userId', res.userId);
        localStorage.setItem('token', res.userId);
    };


    return (
        <form onSubmit={handleSubmit}>
            <label>
                Name:
                <input type="text" id="name" placeholder="Name" className="border border-gray-800" />
            </label>
            <br/>
            <br/>
            <label>
                Email:
                <input type="text" id="email" placeholder="Description" className="border border-gray-800"/>
            </label>
            <br/>
            <input type="submit" value="Submit" />
        </form>
    );
};