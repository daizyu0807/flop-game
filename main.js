const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished'
}

const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

// ---view 
const view = {
  getCardElement(index) { // 添加卡牌編號與背景樣式
    return `<div data-index="${index}" class="card back"></div>`
  },

  getCardContent(index) { // 添加卡牌號碼與花色
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]

    return `
      <p>${number}</p>
      <img src="${symbol}" />
      <p>${number}</p>
    `
  },

  transformNumber(number) { // 處理指定卡牌數字 A、J、Q、K
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  displayCards(indexes) { // 顯示卡牌組
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  flipCards(...cards) { // 卡牌翻牌
    cards.map(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      card.classList.add('back')
      card.innerHTML = null
    })
  },

  pairCards(...cards) { // 添加配對完成樣式
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  renderScore(score) { // 顯示得分
    document.querySelector('.score').textContent = `Score: ${score}`
  },

  renderTriedTimes(times) { // 顯示次數
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },

  appendWrongAnimation(...cards) { // 顯示錯誤動畫
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },

  showGameFinished() { // 遊戲完成樣式
    const div = document.createElement('div')

    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

// ---model
const model = {
  revealedCards: [], // 卡牌配對列表

  isRevealedCardsMatched() { // 卡牌配對列表資料相同返回 true
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,

  triedTimes: 0
}


// ---controller
const controller = {
  currentState: GAME_STATE.FirstCardAwaits, // 初始狀態

  generateCards() { // 洗牌並顯示
    view.displayCards(utility.getRandomNumberArray(52))
  },

  // 遊戲操作
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) { // 不作用在未翻面牌
      return
    }
    // 判斷狀態
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits: // 判斷狀態：尚未翻第一張牌
        view.flipCards(card) // 點擊目標翻牌
        model.revealedCards.push(card) // 目標加入卡牌配對列表
        this.currentState = GAME_STATE.SecondCardAwaits // 變更目前狀態：尚未翻第二張牌
        break

      case GAME_STATE.SecondCardAwaits: // 判斷狀態：尚未翻第二張牌
        view.renderTriedTimes(++model.triedTimes) // 次數 + 1

        view.flipCards(card) // 點擊目標翻牌
        model.revealedCards.push(card) // 目標加入卡牌配對列表

        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10) // 分數 + 10

          this.currentState = GAME_STATE.CardsMatched // 變更目前狀態：配對成功
          view.pairCards(...model.revealedCards) // 添加配對完成樣式
          model.revealedCards = [] // 卡牌配對列表清空

          if (model.score === 260) { // 判斷完成遊戲分數
            this.currentState = GAME_STATE.GameFinished // 變更目前狀態為：遊戲結束
            view.showGameFinished() // 顯示遊戲結束
            return
          }

          this.currentState = GAME_STATE.FirstCardAwaits // 遊戲初始化
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed // 變更目前狀態：配對失敗
          view.appendWrongAnimation(...model.revealedCards) // 顯示配對失敗動畫
          setTimeout(this.resetCards, 1000) // 等待 1 秒後卡牌翻回
        }
        break
    }
  },

  resetCards() { // 卡牌翻回
    view.flipCards(...model.revealedCards) // 卡牌配對列表卡牌翻回
    model.revealedCards = [] // 卡牌配對列表清空
    controller.currentState = GAME_STATE.FirstCardAwaits // 變更目前狀態：尚未翻第一張牌
  }
}

// ---utility
const utility = { // 洗牌演算法（Fisher-Yates Shuffle）
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys()) // 取得總牌總數
    for (let index = number.length - 1; index > 0; index--) { // 迴圈卡牌總數
      let randomIndex = Math.floor(Math.random() * (index + 1)) // 產出目前序號 -1 隨機數
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]] // 交換卡牌
    }
    return number
  }
}

controller.generateCards() // 觸發洗牌

// 監聽卡牌
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})
