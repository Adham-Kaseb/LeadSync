export class VoiceInput {
    constructor(onResult, onStatusChange) {
        this.recognition = null;
        this.isRecording = false;
        this.onResult = onResult; 
        this.onStatusChange = onStatusChange; 
        this.lang = 'ar-EG'; 
        
        this.init();
    }

    init() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = this.lang;

            this.recognition.onstart = () => {
                this.isRecording = true;
                if(this.onStatusChange) this.onStatusChange('start');
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                if(this.onStatusChange) this.onStatusChange('end');
            };

            this.recognition.onerror = (event) => {
                console.error('Speech Recognition Error', event.error);
                if(this.onStatusChange) this.onStatusChange('error');
            };

            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                if(this.onResult) this.onResult(finalTranscript, interimTranscript);
            };
        } else {
            console.warn('Web Speech API not supported');
        }
    }

    setLanguage(lang) {
        this.lang = lang;
        if(this.recognition) this.recognition.lang = lang;
    }

    toggle() {
        if(!this.recognition) return;
        if(this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }
}
