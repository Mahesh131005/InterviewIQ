import axios from 'axios';

async function t() {
    try {
        const res = await axios.post('http://localhost:5000/api/submissions/run', {
            questionId: "a0cf5c49-eb34-4b8c-b630-fb68bc049f3e", // Whatever ID Reverse String is, actually let's just use the db!
            code: 'print("hello")',
            language: 'python',
            customInput: '"hello"'
        });
        console.log(res.data);
    } catch (e) {
        console.log(e.response ? e.response.data : e.message);
    }
}
t();
