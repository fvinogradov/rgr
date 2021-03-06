// Объявление глобальных переменных
var fs = require('fs');
var url = require('url');
var http = require('http');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var cityx;

//Фунция загрузки страницы
function getPage(pageurl, callback) {
    var options = {
        host: url.parse(pageurl).host,
        port: 80,
        path: url.parse(pageurl).pathname
    };
    var text = '';
    http.get(options, function(res) {
        res.on('data', function(data) {
            text += data;
        });
        res.on('end', function() {
//          Вызов функции обработки погоды по окончании запроса
            getWeather(text, callback)
        });
    });
}

//Фунция обработки загруженной погоды
function getWeather(txt, res){
    var p = {};
    parser.parseString(txt ,

        function (err, result){
        var fact = result.forecast.day[0];
        var tom = result.forecast.day[1];

        p.fact = {
            date:fact.$.date,
            sunrise:fact.sunrise[0],
            sunset:fact.sunset[0],
            day:{
                temp:fact.day_part[4].temperature[0],
                type:fact.day_part[4].weather_type[0],
                wind:fact.day_part[4].wind_speed[0]
            },
            night:{
                temp:fact.day_part[5].temperature[0],
                type:fact.day_part[5].weather_type[0],
                wind:fact.day_part[5].wind_speed[0]
            }
        };
        p.tomorrow = {
            date:tom.$.date,
            sunrise:tom.sunrise[0],
            sunset:tom.sunset[0],
            day:{
                temp:tom.day_part[4].temperature[0],
                type:tom.day_part[4].weather_type[0],
                wind:tom.day_part[4].wind_speed[0]
            },
            night:{
                temp:tom.day_part[5].temperature[0],
                type:tom.day_part[5].weather_type[0],
                wind:tom.day_part[5].wind_speed[0]
            }
        };
        res.json('<b>Прогноз погоды:</b><br />'+cityx.$.country+', '+cityx.$.region+', '+cityx._+'<br /><br /><b>Сегодня '+p.fact.date+':</b><br />Днем '+p.fact.day.temp+' С, '+p.fact.day.type+', скорость ветра '+p.fact.day.wind+' м/с<br />Ночью '+p.fact.night.temp+' С, '+p.fact.night.type+', скорость ветра '+p.fact.night.wind+' м/с.<br />Восход в '+p.fact.sunrise+', заход в '+p.fact.sunset+'<br /><br /><b>Завтра '+p.tomorrow.date+':</b><br />Днем '+p.tomorrow.day.temp+' С, '+p.tomorrow.day.type+', скорость ветра '+p.tomorrow.day.wind+' м/с<br />Ночью '+p.tomorrow.night.temp+' С, '+p.tomorrow.night.type+', скорость ветра '+p.tomorrow.night.wind+' м/с.<br />Восход в '+p.tomorrow.sunrise+', заход в '+p.tomorrow.sunset);

    });
}

//Поиск города в xml-файле.
function parseXml(quer, callback) {
    fs.readFile('cities.xml',{encoding:'utf-8'}, function(err, data) {
        parser.parseString(data, function (err, result) {
            var r = result.cities.country[1].city[3];
            for(var stran in result.cities.country){
                for(var gor in result.cities.country[stran].city){
                    city = result.cities.country[stran].city[gor];
                    if(city._.toLowerCase() == quer.toLowerCase()){
                        cityx = city;
                        callback({name:city._, region:city.$.part, country:city.$.country, id:city.$.id});
                    };
                }
            }
        });
    });
}
var prognoz = '';

exports.index = function(req, res){
    parseXml(
        req.param('query'), function(city){
        var txt = getPage('http://export.yandex.ru/weather-ng/forecasts/' + city.id + '.xml', res);
    });
};

//Функция получения списка стран
exports.getCountries = function(req,res){
    var countries = [];
    fs.readFile('cities.xml',{encoding:'utf-8'}, function(err, data) {
        parser.parseString(data, function (err, result) {
            for(var i = 0, length = result.cities.country.length;i<length;i++){
                countries.push(result.cities.country[i].$.name);
            }
            res.json(countries);
        });
    });
}

//Функция получения списка городов по стране
exports.getCitiesByCountry = function(req, res){
    var resCities = [];
    var country = req.param('strana');
    fs.readFile('cities.xml',{encoding:'utf-8'}, function(err, data) {
        parser.parseString(data, function (err, result) {
            for(var i = 0, length = result.cities.country.length;i<length;i++) {
                if ( result.cities.country[i].$.name.toString().toLowerCase() == country.toString().toLowerCase()) {
                    for(var j = 0, newLength = result.cities.country[i].city.length;j<newLength;j++) {
//                        console.log(result.cities.country[i])
                        resCities.push(result.cities.country[i].city[j]._);
                    }
                }
            }
            res.json(resCities);
        });
    });
}
