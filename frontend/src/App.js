import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";

const Container = styled.div`
  text-align: center;
  margin-top: 50px;
`;

const Input = styled.input`
  width: 300px;
  padding: 10px;
  margin-right: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: blue;
  color: white;
  border: none;
  cursor: pointer;
`;

const Result = styled.pre`
  margin-top: 20px;
  text-align: left;
  white-space: pre-wrap;
`;

function App() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!query) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `https://macro-api-746891065225.us-central1.run.app/usda?query=${query}`
      );
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData({ error: "Failed to fetch data" });
    }
    setLoading(false);
  };

  return (
    <Container>
      <h1>AI Macro Tracker</h1>
      <Input
        type="text"
        placeholder="Enter food name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button onClick={fetchData} disabled={loading}>
        {loading ? "Loading..." : "Search"}
      </Button>
      {data && <Result>{JSON.stringify(data, null, 2)}</Result>}
    </Container>
  );
}

export default App;
