import React, { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseurl, setBaseurl] = useState('');
  const [auth, setAuth] = useState('');
  const [openapi, setOpenapi] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [response, setResponse] = useState('');

  const [query, setQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState('');
  const [files, setFiles] = useState([]);

  const handleSubmitAddAPI = async (event) => {
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

  const handleSubmitQueryAPI = async () => {
    let response = null;
    if (files.length === 0) {
      console.log("no files");
      response = await fetch("http://localhost:3000/base", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });
    } else {
      console.log("files");
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }
      formData.append("prompt", query);
      // for (var pair of formData.entries()) {
      //   console.log(pair[0]);
      //   console.log(pair[1]);
      // }
      response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });
    }
    const responseData = await response.text();
    setQueryResponse(responseData);
  }

  const handleFileChange = (event) => {
    setFiles(event.target.files);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <form onSubmit={handleSubmitAddAPI} style={{ display: 'flex', flexDirection: 'column', width: '1200px', marginLeft: "40px" }}>
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
      <div style={{ marginLeft: "60px", height: '80vh', display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
        <div>
          <h3>Response:</h3>
          <p style={{ maxWidth: '500px', fontSize: "20px" }}>{response}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
          <h3>Run Query</h3>
          <textarea style={{ height: '200px', width: '200px' }} value={query} onChange={(e) => setQuery(e.target.value)} />
          <div>
            <label htmlFor="images">Files:</label>
            <input type="file" id="images" onChange={handleFileChange} multiple />
          </div>
          <button onClick={handleSubmitQueryAPI}>Submit</button>
          <p style={{ maxWidth: '500px', fontSize: "20px" }}>{queryResponse}</p>

        </div>
      </div>
    </div >
  );
}

export default App;
