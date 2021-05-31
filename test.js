//微事件1



//主线程直接执行



// process.nextTick(function () {



  process.nextTick(function () {

    console.log('111');
    process.nextTick(function () {

      console.log('222');
  
    })

  })
  new Promise(function (resolve) {



    resolve();

  }).then(function () {

    //微事件2

    process.nextTick(function () {

      console.log('555');
  
    })
    console.log('444')

  })
  process.nextTick(function () {

    console.log('333');

  })
//丢到宏事件队列中



// })
//丢到宏事件队列中

