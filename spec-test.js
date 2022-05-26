const { Bluebird } = require('./lib/index')
const promisesAplusTests  = require('promises-aplus-tests')

Bluebird.deferred = function() {
  let dfd = {}
  dfd.promise = new Bluebird((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}

promisesAplusTests(Bluebird, { reporter: 'dot'}, err => {
  if (!err) {
    console.log('测试通过')
  } else {
    console.log(err)
  }
})

// new Bluebird((resolve) => {
//   // resolve(12)
// })
//   .then((res) => {
//     return {
//       then: (resolve, reject) => {
//         resolve(res + 1)
//       },
//     }
//   })
//   .then((res) => console.log('res', res))
