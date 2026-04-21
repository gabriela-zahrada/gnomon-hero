const container = document.getElementById('preview');
const svgText = await fetch('/outputs/sample-dial.svg').then((r) => r.text());
container.innerHTML = svgText;
