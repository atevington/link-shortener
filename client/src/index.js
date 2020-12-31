import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import axios from "axios";
import "typeface-roboto";

// hack to see if this is running locally or not
const apiBaseUrl =
  window.location.hostname === "localhost"
    ? "http://localhost:3001/"
    : `${window.location.protocol}//${window.location.host}/`;

const apiClient = axios.create({ baseURL: apiBaseUrl });

const Shortener = () => {
  const [linkToShorten, setLinkToShorten] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shortId, setShortId] = useState("");

  const updateLinkToShorten = ({ target: { value } }) =>
    setLinkToShorten(value);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const {
      data: { shortId },
    } = await apiClient.post(`/link/${encodeURIComponent(linkToShorten)}`);

    // reset form
    setLinkToShorten("");
    setSubmitting(false);
    setShortId(shortId);
  };

  return (
    <div className="container">
      <div className="container-inner">
        <h1 className="margin-bottom">Andrew's Link Shortener</h1>
        <form onSubmit={onSubmit}>
          <div className="margin-bottom">
            <input
              type="url" // html 5 url input type
              value={linkToShorten}
              onChange={updateLinkToShorten}
              maxLength={2000}
              required
            />{" "}
            <button type="submit" disabled={submitting}>
              Shorten
            </button>
          </div>
          <div>
            {shortId ? (
              <>
                Your shortened link is:{" "}
                <a target="_blank" href={`${apiBaseUrl}${shortId}`}>
                  {`${apiBaseUrl}${shortId}`}
                </a>{" "}
                (
                <a target="_blank" href={`${apiBaseUrl}${shortId}/stats`}>
                  Stats
                </a>
                )
              </>
            ) : (
              <>Paste a link above to shorten.</>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

ReactDOM.render(<Shortener />, document.getElementById("root"));
