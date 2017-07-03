import { EventEmitter } from 'events';
export class Event {

}
export class Query {
  public result: any;
}
export enum CommandType {
  Change,
  Remove,
  Update,
  Create
}

export class Command {
  type: CommandType;
}
class EventBroker {
  public events: Array<Event> = new Array();

  public commands: EventEmitter = new EventEmitter();
  public queries: EventEmitter = new EventEmitter();

  command(c: Command) {
    this.commands.emit(CommandType[c.type].toString(), c);
  }
  query(q : Query) {
    this.queries.emit('query', q);
    return q.result;
  }
}
class Person {
  private age: number;
  private broker: EventBroker;

  constructor(broker: EventBroker) {
    this.broker = broker;
    this.broker.commands.on('Change', this.onCommand);
    this.broker.queries.on('query', this.onQuery);
  }
  onCommand = (q) => {
    let cac = q.target;
    if(q.type == CommandType.Change) {
      this.broker.events.push(new AgeChangedEvent(q.target, this.age, q.age));
      this.age = q.age;
      console.log(`age changed to ${this.age}`);
    }
  }
  onQuery = (q) => {
    q.result = this.age;
    return q.result;
  }
}

class ChangeAgeCommand extends Command {
  target: Person;
  age: number;

  constructor(target, age) {
    super();
    this.age = age;
    this.target = target;
    this.type = CommandType.Change;
  }
}
class AgeQuery extends Query {
  public target : Person;
  constructor(target: Person) {
    super();
    this.target = target;
    this.result = null;
  }
}
class AgeChangedEvent extends Event {
  target: Person;
  oldValue: number;
  newValue: number;
  constructor(target, oldValue, newValue) {
    super();
    this.target = target;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }
  toString() {
    return `Age changed from ${this.oldValue} to ${this.newValue}`;
  }
}

let eb = new EventBroker();
let p = new Person(eb);
eb.command(new ChangeAgeCommand(p, 123));
eb.command(new ChangeAgeCommand(p, 13));
eb.command(new ChangeAgeCommand(p, 1223));
let age = eb.query(new AgeQuery(p));
console.log(age);

eb.events.forEach(c => {
  console.log(c.toString())
})