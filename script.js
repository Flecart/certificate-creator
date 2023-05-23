
const names = [
    'Amanda Arnold',
    'Becky Botsford',
    'Connie Carson',
    'Diana Darden',
    'Eva Edwards',
    'Fiona Fisher',
    'Gina Grant',
    'Hannah Hill',
    'Isabel Ingram',
    'Jenny Jones',
    'Katie Kline',
]


const endpoint = "http://localhost:3000/api/certificate/create?name="
// make fetch request to endpoint and print result

for (const name of names) {
    fetch(endpoint + name)
    .then(response => response.json())
    .then(data => console.log(`${name}, ${data.data}`))
}