type OnResolve<T> = (value: T | PromiseLike<T>) => void
type OnReject = (reason: any) => void

enum STATUS {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
}

function isPromise(value: any): value is PromiseLike<any> {
  return (
    ((typeof value === 'object' && value !== null) || typeof value === 'function') && typeof value.then === 'function'
  )
}

export class Bluebird<T> implements PromiseLike<T> {
  status = STATUS.PENDING
  value!: T
  reason: any
  onfulfilledCallbacks: (() => void)[] = []
  onrejectedCallbacks: (() => void)[] = []
  translated = false
  constructor(excutor?: (resolve: OnResolve<T>, reject: OnReject) => void) {
    typeof excutor === 'function' && excutor(this._resolve.bind(this), this._reject.bind(this))
  }

  private _resolvePromise(val: T) {
    this.status = STATUS.FULFILLED
    this.value = val
    setTimeout(() => {
      this.onfulfilledCallbacks.forEach((cb) => cb())
    }, 0)
  }

  private _rejectPromise(reason: any) {
    this.status = STATUS.REJECTED
    this.reason = reason
    setTimeout(() => {
      this.onrejectedCallbacks.forEach((cb) => cb())
    }, 0)
  }

  private _resolve(value: T | PromiseLike<T>) {
    if (!this.translated) {
      this.translated = true
      if (isPromise(value)) {
        value.then(this._resolvePromise.bind(this), this._rejectPromise.bind(this))
      } else {
        this._resolvePromise(value)
      }
    }
  }

  private _reject(reason: any) {
    if (!this.translated) {
      this.translated = true
      this._rejectPromise(reason)
    }
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return new Bluebird((resolve, reject) => {
      const _resolve = () => {
        try {
          const result = typeof onfulfilled === 'function' ? onfulfilled(this.value) : this.value
          if ((result as any) === this) throw TypeError()
          if (isPromise(result)) {
            result.then.call(result, resolve, reject)
          } else {
            resolve(result as TResult1)
          }
        } catch (error) {
          reject(error)
        }
      }

      const _reject = () => {
        try {
          const result = typeof onrejected === 'function' ? onrejected(this.reason) : this.reason
          if ((result as any) === this) throw TypeError()
          if (isPromise(result)) {
            result.then.call(result, resolve, reject)
          } else {
            resolve(result)
          }
        } catch (error) {
          reject(error)
        }
      }
      // pending
      if (this.status === STATUS.PENDING) {
        this.onfulfilledCallbacks.push(_resolve)
        this.onrejectedCallbacks.push(_reject)
      }

      // fulfilled
      if (this.status === STATUS.FULFILLED) {
        _resolve()
      }

      // rejected
      if (this.status === STATUS.REJECTED) {
        _reject()
      }
    })
  }
}

// const pro = new Bluebird<number>((resolve, reject) => {
//   setTimeout(() => {
//     resolve(12)
//   }, 100)
// })
// ;(async () => {
//   const result = await pro
//     .then()
//     .then((res) => {
//       console.log('res', res)
//       return { name: '123' }
//     })
//     .then()
//     .then((res) => {
//       throw 'error 123'
//     })
//     .then(
//       (res) => {},
//       (err) => {
//         return 12222
//       },
//     )
//     .then((res) => {
//       return res
//     })
//     .then((res) => {
//       const p = new Bluebird((resolve) => {
//         resolve(res)
//       })
//       return p
//     })
//   debugger
// })()

// const p = new Bluebird((resolve) => {
//   resolve(12)
// })
// new Bluebird((resolve) => {
//   resolve(12)
// })
//   .then(() => {
//     return new Bluebird((resolve, reject) => reject(1))
//   })
//   .then(
//     (res) => {
//       debugger
//     },
//     (err) => {
//       debugger
//     },
//   )

// new Bluebird<number>((resolve) => {
//   resolve(12)
// })
//   .then((res) => {
//     return {
//       then: (resolve, reject) => {
//         resolve!(res + 1)
//       },
//     } as PromiseLike<any>
//   })
//   .then((res) => {
//     debugger
//     console.log('res', res)
//   })
