import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // Ensure styles are applied

const API_KEY = "681a81fd"; // Replace with your actual OMDb API key
const YOUTUBE_API_KEY = "AIzaSyCXCDY4nuJVMbJIfrCastpKkSn2Y4uBdmQ"; // Replace with your actual YouTube API key

const MovieSearchApp = () => {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playingTrailer, setPlayingTrailer] = useState(null);

  // 🔍 Updated searchMovies function (filters exact matches)
  const searchMovies = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `https://www.omdbapi.com/?s=${query}&type=movie&apikey=${API_KEY}`
      );

      if (response.data.Response === "True") {
        // ✅ Filter only exact matches (case insensitive)
        const exactMatches = response.data.Search.filter(
          (movie) => movie.Title.toLowerCase() === query.toLowerCase()
        );

        if (exactMatches.length === 0) {
          setMovies([]);
          setError("No exact matches found.");
          return;
        }

        // ✅ Fetch IMDb rating for each exact match
        const moviesWithRatings = await Promise.all(
          exactMatches.map(async (movie) => {
            const details = await axios.get(
              `https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`
            );
            return {
              ...movie,
              imdbRating: details.data.imdbRating || "N/A",
              Year: details.data.Year,
            };
          })
        );

        setMovies(moviesWithRatings);
      } else {
        setMovies([]);
        setError(response.data.Error);
      }
    } catch (err) {
      setError("Failed to fetch movies.");
    } finally {
      setLoading(false);
    }
  };

  // 🎬 Fetch trailer with better accuracy
  const fetchTrailer = async (title, imdbID) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${title} official trailer&key=${YOUTUBE_API_KEY}`
      );
      const videoId = response.data.items[0]?.id?.videoId;
      if (videoId) {
        setPlayingTrailer({ imdbID, videoId });
      } else {
        alert("Trailer not found.");
      }
    } catch (error) {
      alert("Error fetching trailer.");
    }
  };

  return (
    <div className="container">
      <h1 className="title">🎬 Movie Search App</h1>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={searchMovies}>Search</button>
      </div>

      {loading && <p className="loading">🔄 Loading...</p>}
      {error && <p className="error">⚠ {error}</p>}

      <div className="movies-grid">
        {movies.map((movie) => (
          <div key={movie.imdbID} className="movie-card">
            {playingTrailer?.imdbID === movie.imdbID ? (
              <iframe
                width="100%"
                height="300"
                src={`https://www.youtube.com/embed/${playingTrailer.videoId}?autoplay=1`}
                title="Movie Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <img
                src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/200x300"}
                alt={movie.Title}
                className="movie-poster"
                onClick={() => fetchTrailer(movie.Title, movie.imdbID)}
              />
            )}
            <h2>{movie.Title}</h2>
            <p>Year: {movie.Year}</p>
            <p>⭐ IMDb Rating: {movie.imdbRating}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieSearchApp;

//npm run dev
