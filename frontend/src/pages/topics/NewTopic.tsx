import { BaseSyntheticEvent } from "react";
import { createTopic } from "../../api/internal";



export const NewTopic = () => {

    const handleSubmit = async (event: BaseSyntheticEvent) => {
        event.preventDefault();
        console.log(event);
        const name = event.target.querySelector('#name').value;
        const description = event.target.querySelector('#description').value;
        const body = { name, description };
        const res = await createTopic(body);
        console.log(res);
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
                Description:
                <input type="text" id="description" placeholder="Description" className="border border-gray-800"/>
            </label>
            <br/>
            <input type="submit" value="Submit" />
        </form>
    );
};