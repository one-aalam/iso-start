import express from 'express';
import routes from './routes';


var app = express();
    app.get('/',routes.about);
    app.get('/contact', routes.contact);
    app.get('/about',routes.about);


    app.listen(8080, function(){
        console.log("Application started at 8080");
    });