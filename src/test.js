const { url } = require("inspector");

// const response = fetch(data['url'], {
//     method: data['method'],
// }).then((res) => {
//     const data = res.json()
//     console.log(data);
// })

const hitIt = async () => {
    const data = { url: 'https://api.chucknorris.io/jokes/random', method: 'GET' }
    const url = data['url'];
    delete data['url'];
    const response = await fetch(url, { ...data });
    const d = await response.json()
    console.log(d);
}

hitIt();