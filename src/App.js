import React from 'react';
import './App.css';
import axios from 'axios';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],                               // Results from search for a show
      showID: -1,                             // Show selected
      input: "",                              // User input. Set to invalid if user types non allowed character
      goodInput: true,                        // Used to track if user typed non allowed character
      showClear: true,                        // Toggle to hide and show clear button
      showSummary: '',                        // Keep track of show summary
      seasonInfo: [],                         // All the seasons for a show
      seasonSelectionTxt: 'Select Season',    // Used for season dropdown when user makes a selection
      seasonID: -1,                           // Season selected
      seasonDisplay: 0,                       // Toggle for season dropdown
      seasonShows: [],                        // List of episodes in a season
      percentages: [],                        // Percentages used for dot, bubble, and traingle placement
      episodeIndex: -1                        // Episode selected
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.renderSearchResult = this.renderSearchResult.bind(this);
    this.handleShowSelection = this.handleShowSelection.bind(this);
    this.handleSeasonButton = this.handleSeasonButton.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
    this.handleSeasonSelect = this.handleSeasonSelect.bind(this);
    this.handleEpisodeClick = this.handleEpisodeClick.bind(this);
    this.closeBubble = this.closeBubble.bind(this);
  }

  async getResults(input){
    let res = await axios.get('http://api.tvmaze.com/search/shows?q=' + input);
    this.setState({
      data: res.data
    });
  }

  async getShowMainInfo(id){
    let showMainInfo = await axios.get('http://api.tvmaze.com/shows/' + id);
    let showSeasonInfo = await axios.get('http://api.tvmaze.com/shows/' + id + '/seasons');
    var summary = showMainInfo.data.summary;
    // Show summary and add show name in between
    summary = summary.slice(0, 3) + "<h2>" + showMainInfo.data.name + "</h2>" + summary.slice(3);
    this.setState({
      showSummary: summary,
      seasonInfo: showSeasonInfo.data
    });
  }

  async getSeasonShows(id){
    let res = await axios.get('http://api.tvmaze.com/seasons/' + id + '/episodes');
    var shows = [];
    var times = [];
    var percentage = [];
    // Excluding specials
    for(var i in res.data){
      if(res.data[i].number != null) shows.push(res.data[i]);
    }
    var len = shows.length;
    // Calculating position for the timeline
    // Calculating the difference in airdate of each episode and the first episode of the seasons
    for(i in shows){
      var diff = Date.parse(shows[i].airstamp) - Date.parse(shows[0].airstamp);
      times.push(diff);
    }
    // Dividing the difference by the largest difference which is the last episode of the season to get percentages
    for(i in times){
      var percent = times[i] / times[len - 1] * 100;
      if(times[len - 1] === 0) percent = 0;
      percentage.push(percent);
    }
    this.setState({
      seasonShows: shows,
      percentages: percentage
    });
  }

  handleInputChange(event) {
    // Check for characters other than numbers, letters, and whitespace
    var alphanum = /[0-9a-zA-Z ]+/;
    var inputTxt = event.target.value;
    if(inputTxt.charAt(inputTxt.length - 1).match(alphanum)){
      // Good input
      this.setState({
        goodInput: true,
        input: inputTxt,
        showClear: false
      });
      this.getResults(inputTxt);
    }
    else{
      this.setState({
        // Bad input. Delete everything user typed, remove search results, and indicate a bad input
        data: [],
        goodInput: false,
        input: "",
        showClear: true
      });
    }
  }

  // When a show is selected
  handleShowSelection(id, name) {
    this.setState({
      showID: id,
      goodInput: true,
      input: name,
      data: [],
      showClear: true
    });
    this.getShowMainInfo(id);
  }

  // Resets state of application
  clearSelection() {
    this.setState({
      data: [],
      showID: -1,
      input: "",
      goodInput: true,
      showClear: true,
      showSummary: '',
      seasonInfo: [],
      seasonSelectionTxt: 'Select Season',
      seasonID: -1,
      seasonDisplay: 0,
      seasonShows: [],
      percentages: [],
      episodeIndex: -1
    });
  }

  // Show/hide dropdown
  handleSeasonButton(){
    // Toggle to show and hide options dropdown
    var x = (this.state.seasonDisplay + 1) % 2;
    this.setState({
      seasonDisplay: x
    });
  }

  // Select a season, hide the rest of the options
  handleSeasonSelect(id, text){
    var x = (this.state.seasonDisplay + 1) % 2;
    this.setState({
      seasonDisplay: x,
      seasonID: id,
      seasonSelectionTxt: text,
      episodeIndex: -1
    });
    this.getSeasonShows(id);
  }

  // When an episode dot is clicked the episode is selected
  handleEpisodeClick(i){
    this.setState({
      episodeIndex: i
    });
  }

  // Close button for bubble reset current episode selected
  closeBubble(event){
    event.stopPropagation();
    this.setState({
      episodeIndex: -1
    });
  }

  // Rendering the dots for the timeline along with the bubble containing the episode information
  // All are rendered but only the selected episode is displayed
  renderDots(){
    const dots = [];
    for(var i in this.state.percentages){
      // When a bubble is too close to either side it needs to be shifted correctly
      var transformAmount = 50;
      if(this.state.percentages[i] < 20){
        transformAmount = 10;
      }
      if(this.state.percentages[i] > 80){
        transformAmount = 90;
      }
      // Creating a dot for each episode. Position is caculated based on percentage
      dots.push(
        <div key={i} className={this.state.episodeIndex === i ? "dot black" : "dot"} onClick={this.handleEpisodeClick.bind(this, i)} style={{left: this.state.percentages[i] + '%' }}>
          {/* Render a triangle and bubble for each dot
              Only visible when it is the current episode selected */}
          <div className={this.state.episodeIndex === i ? "triangle" : "triangle hide"}/>
          <div className={this.state.episodeIndex === i ? "bubble" : "bubble hide"} style={{transform: "translate(-" + transformAmount + "%)"}}>
            <div className="episodeImage">
              {this.state.seasonShows[i].image == null ? <div className="imgAlt"><div className="imgAltTxt">Episode Image/ Image Not Available</div></div> : <img src={this.state.seasonShows[i].image.medium} alt="Episode"/>}
            </div>
            <div className="episodeInfo">
              <div className="closeButton" onClick={this.closeBubble}>
                <div className="line" />
                <div className="line" style={{transform: "rotate(-45deg)"}}/>
              </div>
              <h2 className="episodeTitle" align="left">{this.state.seasonShows[i].name}</h2>
              <div className="episodeSummary" align="left" dangerouslySetInnerHTML={this.state.seasonShows.length === 0 ? null : {__html: this.state.seasonShows[i].summary}} />
            </div>
          </div>
        </div>
      );
    }
    return (dots);
  }

  // Labels for dots representing different episodes
  renderDotLabels(){
    const dots = [];
    for(var i in this.state.percentages){
      var count = parseInt(i) + 1;
      // This is done when a label is too close to either end and needs to be shifted correctly
      var transformAmount = 50;
      if(this.state.percentages[i] < 1.5){
        transformAmount = 0;
      }
      if(this.state.percentages[i] > 98.5){
        transformAmount =90;
      }
      dots.push(
        <div key={i} className={this.state.episodeIndex === i ? "dotLabel bold" : "dotLabel"} style={{left: this.state.percentages[i] + '%' , transform: "translate(-" + transformAmount + "%, 16px)"}}>
          Episode {count}
        </div>
      );
    }
    return (dots);
  }

  // Get number of seasons available and render the dropdown options
  renderSeasonOptions(){
    const options = [];
    for(var i = 0; i < this.state.seasonInfo.length; i++){
      var season = "Season " + (i + 1);
      // Keeping track of season id
      var id = this.state.seasonInfo[i].id;
      options.push(
        <div key={i} className="text options" onClick={this.handleSeasonSelect.bind(this, id, season)}>{season}</div>
      );
    }
    return (options);
  }

  // Get search results when searching for a show
  renderSearchResult() {
    const items = [];
    for(var i = 0; i < this.state.data.length; i++) {
      // Keeping track of show id for when user selects a show
      var id = this.state.data[i].show.id;
      var name = this.state.data[i].show.name;
      var rating = this.state.data[i].show.rating.average ? this.state.data[i].show.rating.average : "Unknown";

      // Formatting the date
      var date = new Date(this.state.data[i].show.premiered);
      var dateInfo = new Intl.DateTimeFormat('en-US', {month: 'long'}).format(date);
      dateInfo = dateInfo + ' ' + date.getUTCDate() + ', ' + date.getFullYear();

      items.push(
        <tr key={i} className="results" onClick={this.handleShowSelection.bind(this, id, name)}>
          <td className="name">{name}</td>
          <td className="date">premiered on {dateInfo}</td>
          <td className="rating">Rating: {rating}</td>
        </tr>
      );
    }
    return (items);
  }

  render() {
    return (
      <div>
        <header>
          <div className="text" id="heading">Home | <span id="heading2">SEARCH TV SHOW</span></div>
        </header>
        <article>
          <div className={this.state.goodInput ? "text label" : "text label invalidInput"}>Search TV show {this.state.goodInput ? null : "\u2022 Please enter valid title"}</div>

          {/* Orange bar indicating bad input */}
          <div style={{position: "relative"}}>
            {this.state.goodInput ? null : <div id="invalid"></div>}
          </div>

          {/* Table used as container for dropdown showing shows */}
          <table cellSpacing="0" cellPadding="0">
            <tbody>
              <tr>
                <td colSpan="3">
                  {/* Input box is first row */}
                  <input type="text" onChange={this.handleInputChange} value={this.state.input} placeholder={this.state.goodInput ? "Please enter TV show title" : "Invalid title"} disabled={this.state.showID === -1 ? false : true}/>
                </td>
              </tr>
              {this.renderSearchResult()}
            </tbody>
          </table>

          {/* Clear button is hidden when the table is expanded */}
          {this.state.showClear || this.state.data.length === 0 ? <button id="clearButton" type="button" onClick={this.clearSelection}>Clear</button> : null}

          {/* Show information only visible when a show is selected */}
          {this.state.showID === -1 ? null :
            <div id="showInfo">

              {/* Show summary. Three are rendered. One main one. Back two are rotated slightly for visual effect */}
              <div className="showSummary" dangerouslySetInnerHTML={{__html: this.state.showSummary}} />
              <div className="showSummary bg" style={{transform: "rotate(1deg)"}} dangerouslySetInnerHTML={{__html: this.state.showSummary}} />
              <div className="showSummary bg" style={{transform: "rotate(-1deg)"}} dangerouslySetInnerHTML={{__html: this.state.showSummary}} />

              <div className="text label">Seasons</div>
              {/* Dropdown to display available seasons */}
              <div className={this.state.seasonDisplay === 0 ? "dropdown" : "dropdown clicked"} onClick={this.handleSeasonButton}>
                <div style={{paddingLeft: "10px"}}>
                  {this.state.seasonSelectionTxt}
                </div>
              </div>
              {/* Dropdown options that are toggled visible and hidden */}
              <div className={this.state.seasonDisplay === 0 ? "dropdownOptions hidden" : "dropdownOptions"}>
                {this.renderSeasonOptions()}
              </div>
            </div>
          }
        </article>

        {/* Side logo */}
        <aside >
          <div id="dotLogo"></div>
          <div id="rect"></div>
          <div id="logo">
            <h1 style={{marginTop: "0px", paddingTop: "0.67em"}}>TV</h1>
            <h1>SH</h1>
            <h1>OW</h1>
          </div >
        </aside>

        {/* Time line. Rendered only if a season is selected */}
        <div id="timelineSection">
          {this.state.seasonID === -1 ? null :
            <div id="timeline">
              {this.renderDots()}
              {this.renderDotLabels()}
            </div>
          }
        </div>

        {/* Bottom footer section */}
        <footer>
          <div id="line" />
          <div id="contactUs">Contact us</div>
          <div id="info">
            <div className="infoSection">
              <div className="sectionLabel">
                <span className="orange">Address</span> | Mailing
              </div>
              <div className="mainInfo">Primary Address Line</div>
              <div className="subInfo">Secondary Address Line<br/>12345 Postal Code</div>
            </div>
            <div className="infoSection">
              <div className="sectionLabel">
                <span className="orange">Phone</span> | Ring! Ring!
              </div>
              <div className="mainInfo">Headline</div>
              <div className="subInfo">+1 123 456 7890</div>
            </div>
            <div className="infoSection">
              <div className="sectionLabel">
                <span className="orange">E-Mail</span> | Swoosh!
              </div>
              <div className="mainInfo">email@email.com</div>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}

export default App;
