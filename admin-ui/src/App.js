import React, { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseurl, setBaseurl] = useState('');
  const [auth, setAuth] = useState('');
  const [openapi, setOpenapi] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    const data = {
      name,
      description,
      baseurl,
      auth,
      websiteUrl: websiteUrl,
      openapi,
    };

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };

    const response = await fetch('http://localhost:3000/add', requestOptions);
    const responseData = await response.text();

    setResponse(responseData);
    // setName('');
    // setDescription('');
    // setBaseurl('');
    // setAuth('');
    // setWebsiteUrl('');
    // setOpenapi('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '1500px', marginLeft: "40px" }}>
        <h1>Add API</h1>
        <label>The name of the api endpoint:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Description for the vectorDB:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required style={{ height: '200px' }}></textarea>

        <label>the url for the endpoint: 'www.google.com':</label>
        <input value={baseurl} onChange={(e) => setBaseurl(e.target.value)} required />

        <label>Auth: this is optional (don't do anything for now):</label>
        <input value={auth} onChange={(e) => setAuth(e.target.value)} />

        <label>this is the url where you found the information</label>
        <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} required />

        <label>Documentation for api. Look at this link: "https://spec.openapis.org/oas/v3.1.0":</label>
        <textarea value={openapi} onChange={(e) => setOpenapi(e.target.value)} required style={{ height: '600px' }}></textarea>

        <button type="submit" >Submit</button>
      </form >
      <div style={{ marginLeft: "60px" }}>
        <h3>Response:</h3>
        <p style={{ maxWidth: '500px', fontSize: "20px" }}>{response}</p>
      </div>
    </div >
  );
}

export default App;