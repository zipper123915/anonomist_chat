<template>
  <div class="chat">
    <v-container class="cont">
      <div class="header">
        <p>{{ info }}</p>
        <v-btn class="btn" color="primary" @click="leaveChat">Leave Chat</v-btn>
      </div>
      <MessageContainer :messages="messages"></MessageContainer>
      <div
        :is="info === 'Have a nice chat' ? 'MessageInput' : 'LeavePartner'"
        :disabled="info === 'Partner leave'"></div>
    </v-container>
  </div>
</template>

<script>

import connection from '../assets/js/socket'
import { mapActions, mapGetters } from 'vuex'
import MessageInput from '@/components/MessageInput'
import MessageContainer from '../components/MessageContainer'
import LeavePartner from '@/components/LeavePartner'

export default {
  name: 'Chat',
  components: { MessageContainer, MessageInput, LeavePartner },
  data: () => ({
    info: 'Have a nice chat'
  }),
  beforeRouteLeave(to, from, next) {
    this.clearMessages()
    connection.removeAllListeners('messageFormServer')
    next()
  },
  mounted() {
    localStorage.setItem('chatId', this.$route.query.chatId)
    this.startAddingMessages()

    connection.emit('requestReconnect', this.$route.query.chatId)

    const history = sessionStorage.getItem('messages')
    history && this.setHistory(JSON.parse(history))

    connection.on('partnerLeave', () => {
      connection.emit('leaveChat', { chatId: this.$route.query.chatId, first: false })
      this.info = 'Partner leave'
      // sessionStorage.removeItem('messages')
      // this.$router.replace({ name: 'choose' })
    })
  },
  methods: {
    ...mapActions(['startAddingMessages', 'clearMessages', 'setHistory']),
    leaveChat() {
      localStorage.removeItem('chatId')
      connection.emit('leaveChat', { chatId: this.$route.query.chatId, first: true })
      sessionStorage.removeItem('messages')
      this.$router.replace({ name: 'choose' })
    }
  },
  computed: {
    ...mapGetters(['messages'])
  }
}
</script>

<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
}

.cont {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
