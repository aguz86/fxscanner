import { ForexFactory } from "forexfactory/src/index.ts";

async function test() {
  const ff = new ForexFactory();
  try {
    const calendar = await ff.fetchCalendarEvents();
    const high = calendar.data.flatMap(day => day.events.filter(e => e.impact === "High"));
    console.log(high);
  } catch (e) {
    console.error(e);
  }
}
test();
