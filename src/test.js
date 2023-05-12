
const data = async () => {
    const query = 'What is a chuck norris joke?'
    response = await fetch("http://www.llm-tools.com/base", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
    });
    const responseData = await response.text();
    console.log(responseData);
}

data();
