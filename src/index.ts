type OnResolve<T> = (value: T | PromiseLike<T>) => void
type OnReject = (reason: any) => void

enum STATUS {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
}

export class Bluebird<T> implements PromiseLike<T> {
  status = STATUS.PENDING
  value!: T
  reason: any
  callbacks: (() => void)[] = []
  constructor(excutor?: (resolve: OnResolve<T>, reject: OnReject) => void) {
    typeof excutor === 'function' && excutor(this.resolve.bind(this), this.reject.bind(this))
  }

  private process() {
    setTimeout(() => {
      while (this.callbacks.length > 0) {
        const callback = this.callbacks.shift()
        callback && callback()
      }
    }, 0)
  }

  private _resolve(value: T) {
    if (this.status === STATUS.PENDING) {
      this.status = STATUS.FULFILLED
      this.value = value
      this.process()
    }
  }

  private resolve(value: T | PromiseLike<T>): void {
    if (value === this) {
      this.reject(new TypeError('The promise and its value refer to the same object'))
    } else if (value instanceof Bluebird) {
      // promise
      value.then(this.resolve.bind(this), this.reject.bind(this))
    } else if (typeof value === 'function' || (typeof value === 'object' && value !== null)) {
      let called = false
      try {
        // thenable
        // then maybe is a accessotr
        const then = (value as any).then
        if (typeof then === 'function') {
          then.call(
            value,
            (y: any) => {
              !called && this.resolve(y)
              called = true
            },
            (err: any) => {
              !called && this.reject(err)
              called = true
            },
          )
        } else {
          this._resolve(value as any)
        }
      } catch (error) {
        if (!called) {
          this.reject(error)
        }
      }
    } else {
      this._resolve(value)
    }
  }

  private reject(reason: any) {
    if (this.status === STATUS.PENDING) {
      this.status = STATUS.REJECTED
      this.reason = reason
      this.process()
    }
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return new Bluebird((resolve, reject) => {
      const callback = () => {
        try {
          if (this.status === STATUS.PENDING) return

          let value: any = this.value
          if (this.status === STATUS.FULFILLED && typeof onfulfilled === 'function') {
            value = onfulfilled(this.value)
          } else if (this.status === STATUS.REJECTED) {
            if (typeof onrejected === 'function') {
              value = onrejected(this.reason)
            } else {
              reject(this.reason)
              return
            }
          }
          resolve(value)
        } catch (error) {
          reject(error)
        }
      }

      this.callbacks.push(callback)
      if (this.status !== STATUS.PENDING) {
        this.process()
      }
    })
  }
}
