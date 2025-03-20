import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const Container = styled.div`
  text-align: center;
  max-width: 600px;
  margin: auto;
`;

const Input = styled.input`
  width: 80%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
  border: 1px solid #ccc;
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 10px;
  cursor: pointer;
  border-radius: 5px;
`;

const ResultBox = styled.div`
  border: 1px solid #ddd;
  padding: 10px;
  margin: 10px;
  border-radius: 5px;
  text-align: left;
`;

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `https://macro-api-746891065225.us-central1.run.app/usda?query=${query}`
      );
      setResults(response.data.foods || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
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
      <Button onClick={fetchData}>Search</Button>

      {results.length > 0 &&
        results.map((food, index) => (
          <ResultBox key={index}>
            <h3>{food.description}</h3>
            <p>Calories: {food.foodNutrients.find(n => n.nutrientName === "Energy")?.value || 'N/A'} kcal</p>
            <p>Protein: {food.foodNutrients.find(n => n.nutrientName === "Protein")?.value || 'N/A'} g</p>
            <p>Fat: {food.foodNutrients.find(n => n.nutrientName === "Total lipid (fat)")?.value || 'N/A'} g</p>
            <p>Carbs: {food.foodNutrients.find(n => n.nutrientName === "Carbohydrate, by difference")?.value || 'N/A'} g</p>
          </ResultBox>
        ))}
    </Container>
  );
}

