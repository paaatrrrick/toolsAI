import axios from 'axios';

try {
    const response = await axios.get('https://api.github.com/users/jeffersonRibeiro/repos');
    console.log(response.data);
} catch (error) {
    if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
    }
}