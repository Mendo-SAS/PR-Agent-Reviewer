

class Person {
    name: string;
    age: number;
    gender: string;

    constructor(name: string, age: number, gender: string) {
        this.name = name;
        this.age = age;
        this.gender = gender;
    }
    sayHello() {
        console.log(`Hello, my name is ${this.name} I am a person`);
    }
    sayGoodbye() {
        console.log(`Goodbye, my name is ${this.name} I am a person`);
    }
    sayAge() {
        console.log(`My age is ${this.age} I am a person`);
    }
    sayGender() {
        console.log(`My gender is ${this.gender} I am a person`);
    }
}   

class Student extends Person {
    major: string;

    constructor(name: string, age: number, gender: string, major: string) {
        super(name, age, gender);
        this.major = major;
    }
    sayMajor() {
        console.log(`My major is ${this.major}`);
    }
    sayHello() {
        console.log(`Hello, my name is ${this.name} and my major is ${this.major} I am a student`);
    }
    sayGoodbye() {
        console.log(`Goodbye, my name is ${this.name} and my major is ${this.major} I am a student`);
    }   
    sayAge() {
        console.log(`My age is ${this.age} and my major is ${this.major} I am a student`);
    }
    sayGender() {
        console.log(`My gender is ${this.gender} and my major is ${this.major} I am a student`);
    }
}   

const person = new Person("John", 20, "male");
const student = new Student("Jane", 21, "female", "Computer Science");

person.sayHello();
student.sayHello();
person.sayGoodbye();
student.sayGoodbye();
