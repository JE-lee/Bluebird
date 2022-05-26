Promise.resolve(12).then(
  (res) => {
    throw '33'
  },
  (err) => {
    debugger
  },
)
