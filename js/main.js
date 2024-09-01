import { openweather_key, pexel_key, spotify_ClientId, spotify_ClientSecret } from './config.js';

$(document).ready(function () {
    
    const iconUrl = "http://openweathermap.org/img/wn/";

    var lat = "35.713456";  
    var lon = "139.663682"; 

    /////////////////// Default Setting ///////////////////
    $("#map-modal").hide();

    /////////////////// Show Map ///////////////////
    $('#show-modal-btn').on('click', function () {
        $('#map-modal').show();
        map.invalidateSize(); 
    });

    // Close the pop-up without submitting
    $('#close-modal-btn').on('click', function () {
        $('#map-modal').hide();
    });

    //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
    // Openstreetmap　-> getCoordinate
    // Ref: https://leafletjs.com/examples/quick-start/
    //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

    var map = L.map('map').setView([lat, lon], 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var currentMarker = L.marker([lat, lon]).addTo(map);
    map.on('click', function (e) {
        lat = e.latlng.lat;
        lon = e.latlng.lng;
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        currentMarker = L.marker([lat, lon]).addTo(map);
        refresh();
    });

    //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
    // Get Weather from OpenWeatherMap ->  Call pexels, Spotify API
    //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
    function refresh() {
                
        //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
        //OpenWeatherAPI（天気情報を取得） Forecast 5 Days
        //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
        const ow_url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openweather_key}&units=metric&lang=ja`;

        // Update 5 Day Forecast
        $.ajax({
            url: ow_url,
            type: 'get',
            cache: false,
            dataType: 'json'
        }).done(function(data) {
            $("#forecast").empty();
            let forecastHtml = "";
            for (let i = 0; i < data.list.length; i=i+8) {
                let dateText;
                switch (i) {
                    case 0: dateText = '今日'; break;
                    case 8: dateText = '明日'; break;
                    case 16: dateText = '明後日'; break;
                    default: dateText = `${i/8}日後`;
                }
                forecastHtml += `
                    <div class="flex flex-col items-center">
                        <span>${dateText}</span>
                        <img src="${iconUrl + data.list[i].weather[0].icon}@2x.png" alt="Weather Icon">
                        <span>風速: ${data.list[i].wind.speed} m/s</span>
                        <span>降水確率: ${Math.round(data.list[i].pop * 100)}%</span>

                    </div>`;
            }

            $("#forecast").append(forecastHtml);
            
            $("#curr-weather").html(data.list[0].weather[0].description);
            $("#curr-city").html(data.city.name);
            $("#curr-date").html(data.list[0].dt_txt);
        });

        //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
        //OpenWeatherAPI（天気情報を取得） Current Weather
        //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
        const ow_url_curr = 'https://api.openweathermap.org/data/2.5/weather?lat='+lat+'&lon='+lon+'&appid='+openweather_key;

        $.ajax({
            url: ow_url_curr,
            type: 'get',
            cache: false,
            dataType: 'json'
        }).done(function(data) {
            let currWeather=data.weather[0].description;

            // Update Background Video (Based on the Description of current weather)
            updateBackgroundVideo(currWeather);

            // Update Spotify  (Based on the Description of current weather)
            getSpotifyTrack(currWeather);
        });

    }

    //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
    // Update Background Video from pexels based on Current Weather
    // Ref: https://www.pexels.com/api/documentation/#videos
    //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
    function updateBackgroundVideo(query) {
        // Show one of the first five random video
        const page = Math.floor(Math.random() * 5) + 1;
        const url = `https://api.pexels.com/videos/search?query=${query}&per_page=1&page=${page}`;

        $.ajax({
            url: url,
            type: 'GET',
            headers: {
                Authorization: pexel_key
            },
            cache: false,
            dataType: 'json'
        }).done(function(data) {
            if (data.videos.length > 0) {
                const videoUrl = data.videos[0].video_files[1].link; // UHD Video
                $('#video-source').attr('src', videoUrl); 
                $('#background-video')[0].load(); 
            }
        });
    }

    //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
    // Update Music Player from Spotify based on Current Weather
    // Ref: https://developer.spotify.com/documentation/web-api/tutorials/getting-started
    // Ref: https://developer.spotify.com/documentation/web-api/reference/search
    //＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
    function getSpotifyTrack(query) {

        // Request an Access Token
        const token_url = 'https://accounts.spotify.com/api/token';
        $.ajax({
            url: token_url,
            type: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: `grant_type=client_credentials&client_id=${spotify_ClientId}&client_secret=${spotify_ClientSecret}`,
            cache: false,
            dataType: 'json'
        }).done(function(data) {
            const token=data.access_token;

            // Seach Query
            const search_url = 'https://api.spotify.com/v1/search';
            $.ajax({
                url: search_url,
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                data: `q=${encodeURIComponent(query)}&type=track&limit=1`,
                cache: false,
                dataType: 'json'
            }).done(function(data) {
                const track_id = data.tracks.items[0].id;

                // Music Player
                const playerHtml = `
                        <iframe src="https://open.spotify.com/embed/track/${track_id}" 
                        width="800" height="100" frameborder="0" 
                        allowtransparency="true" allow="encrypted-media"></iframe>`;
                $('#spotify-player').html(playerHtml);

            });
        });
    }

    refresh();

});

