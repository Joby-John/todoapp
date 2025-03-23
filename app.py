from flask import Flask, render_template, request, redirect
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pytz

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///todo.db"
db = SQLAlchemy(app)

class Todo(db.Model):
    sno = db.Column(db.Integer, primary_key = True, autoincrement = True)
    title = db.Column(db.String(200), nullable = False)
    desc = db.Column(db.String(500), nullable = False)
    dateCreated = db.Column(db.DateTime, default = datetime.utcnow)

    @property
    def formatted_time(self):
        # Convert UTC to IST
        ist_timezone = pytz.timezone('Asia/Kolkata')
        ist_time = self.dateCreated.replace(tzinfo=pytz.utc).astimezone(ist_timezone)
        # Format as hr:min:sec
        return ist_time.strftime('%H:%M:%S')


    def __repr__(self)->str:
        return f"{self.sno} - {self.title}"


@app.route('/', methods = ['GET', 'POST'])
def home_page():
    if request.method=='POST':
        title = request.form['title']
        desc = request.form['desc']

        todo = Todo(title = title, desc = desc)
        db.session.add(todo)
        db.session.commit()

    alltodo = Todo.query.all()
    # print(alltodo)
    return render_template('index.html', alltodo = alltodo)
    # return 'Hello World'

@app.route('/delete/<int:sno>')
def delete(sno):
    rowToDelete = Todo.query.filter_by(sno = sno).first()
    db.session.delete(rowToDelete)
    db.session.commit()

    return redirect('/')
    
@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/update/<int:sno>', methods = ['GET', 'POST'])
def update(sno):
    if request.method == 'POST':
        title = request.form['title']
        desc  = request.form['desc']

        rowToUpdate = Todo.query.filter_by(sno=sno).first()
        rowToUpdate.title = title
        rowToUpdate.desc = desc

        db.session.add(rowToUpdate)
        db.session.commit()
        return redirect('/')

    rowToUpdate = Todo.query.filter_by(sno=sno).first()
    return render_template('update.html', rowToUpdate = rowToUpdate)


if __name__ == "__main__":
    app.run(debug=False, port = 8000)