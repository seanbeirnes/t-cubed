import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
            <h1>Hello World!</h1>
            <p className="text-amber-500">This is a test</p>
            <p className="text-bold">{count}</p>
            <button className="bg-amber-50" onClick={() => setCount(count + 1)}>Click me</button>
    </>
  )
}

export default App
