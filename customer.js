(function(d, w) {

    'use strict';

    var Customer = (function() {

        function Customer() {

            //Temsilci tarafından kullanıcı adına oluşturulmuş bilet numarası
            this.TicketNumber = 0;

            //Kullanıcı telefon numarası
            this.PhoneNumber = "0";

            //Kullanıcı oturum numarası. Temsilciden kullanıcıya ait bir oturum numarası
            this.SessionID = "";

            //Kullanıcı ekranı temsilciye aktardı mı. Yani ekranı temsilci mi kullanıyor bunun bilgisi tutuluyor
            this.isDelegate = false;

            //Temcilciye bildirim yapıldı mı. Temsilciye bir ticket bilgisi gönderilip gönderilmediği
            this.isStatus = false;
        }

        //Temsilciye istekte bulunacak method
        Customer.getTicketFromDelegate = function() {

            console.log('Temsilciden Ticket alınıyor...');
            //Burada temsilciye telefon bilgisi gönderilmekte. Gönderilen telefon bilgisine ait bir ticket oluşturulmuşsa
            //Oluşturulan bu ticket numarasını ve sessionID bilgisini temsilciden alıyoruz
            //Bu bilgilerle ilgili sayfayı temsilciye export edeceğiz
            Customer.sendThisPageToDelegate();
        }

        //Kullanıcının Telefon numarasını alalım
        Customer.getPhoneNumber = function() {

            if (!Check.isInputForm) {
                console.log('Kullanıcının telefon numarası alınıyor...');

                //Burada yapılacak durum, kullanıcıya telefon numarasını girebileceği bir input ekranı çıkartmak
                Display.createPhoneNumberForm();
            }
        }

        //Kullanıcı bağlantıyı doğru bir şekilde sağladığında ilgili sayfayı Temsilciye post edecek
        //Bu şekilde temsilci, sadece bu kullanıcıya özel oluşturulmuş sayfayı kontrol edecektir.
        Customer.sendThisPageToDelegate = function() {
            console.log('Temsilciye sayfa export ediliyor...');

            //Sayfadaki HTML veriyi al ve gönderilen
            var HTML = Filter.ClearCode(d.documentElement.innerHTML);
            Service.Connect({

                url: 'http://localhost:2222',
                contentType: Service.ContentType.JSON,
                dataType: Service.ContentType.JSON,
                data: { screenWidth: w.document.documentElement.clientWidth, HTML: HTML },
                method: 'POST'

            });
        }

        //Temsilciden alınan cevabı ileten method
        Customer.getResponse = function() {}

        return Customer;

    })();


    var Filter = (function() {

        function Filter() {

        }

        //İstenmeyen karakter gruplarını temizler
        Filter.ClearCode = function(HTMLValue) {

            var e = [/(<script>?[\w\W\d\D\r\t\b\s\n]+?<\/script>)/];
            for (var reg in e) {
                HTMLValue = HTMLValue.replace(e, '');
            }
            return HTMLValue;
        }

        return Filter;

    })()


    //Durum ve bilgi kontrolleri için kullanılacak nesne
    var Check = (function() {
        function Check() {
            //Ekranda kullanıcıya, telefon numarası formu açıldı mı / açılmadı mı
            this.isInputForm = false;
        }
        //Telefon Kontrolü
        Check.isPhone = function(value) {
            return /05[\d]{9}/.test(value);
        }

        return Check;
    })()



    //Veri gönderme ve alma işlemleri
    var Service = (function() {

        function Service() {
            this.Status = 0;
        }

        Service.StatusType = (function() {
            function StatusType() {
                this.Loading = 100;
                this.Success = 200;
                this.Timeout = 300;
                this.Error = 404;
                this.Ozel = 880;
            }
            return StatusType;
        })()

        Service.Done = function(data) {

            switch (Service.Status) {
                case Service.StatusType.Loading:
                    console.log('Durum Kodu : code(' + Service.Status + ')\nBağlantı yükleniyor...');
                    break;

                case Service.StatusType.Success:

                    //datayı burada parse edelim
                    try {
                        var parse = JSON.parse(data);
                        console.log('Durum Kodu : code(' + Service.Status + ')\nBaşarılı bağlantı sağlandı');
                    } catch (err) {
                        Error.message(err);
                        console.log('Durum Kodu : code(' + Service.Status + ')\nParse işlemi başarısız');
                    }

                    break;

                case Service.StatusType.Timeout:
                    Error.message('Bağlantı sağlanırken zaman aşımına uğradı');
                    console.log('Durum Kodu : code(' + Service.Status + ')\nBağlantı sağlanırken zaman aşımına uğradı');
                    break;

                case Service.StatusType.Error:
                    Error.message('Bağlantı sırasında bilinmeyen bir hata oluştu. Bağlantı sağlanamıyor');
                    console.log('Durum Kodu : code(' + Service.Status + ')\n' + data);
                    break;
            }
        }


        Service.ContentType = (function() {
            function ContentType() {
                this.JSON = 'application/json';
                this.HTML = 'text/html';
                this.XML = 'application/xml';
                this.FORM = 'application/x-www-form-urlencoded; charset=UTF-8';
                this.TEXT = 'text/plain';
            }

            return ContentType;
        })()

        Service.Connect = function(data) {

            try {

                //Methodu varsayılan olarak GET Tanımlar
                data.method = data.method ? data.method : 'GET';

                //Ajax nesnesi oluştur
                var ajax = new XMLHttpRequest();
                //Yol oluştur
                ajax.open(data.method, data.url, true);

                //contentType değeri yoksa varsayılan olarak ata
                if (!data.contentType && data.method == 'POST') {
                    data.contentType = Service.ContentType.FORM;
                }

                //Kesin gönderim yapılacaksa
                if (data.method == 'POST')
                    ajax.setRequestHeader("Content-type", data.contentType);

                //gonderim tipi json ise datayı çevir
                if (data.contentType == Service.ContentType.JSON && data.method == 'POST')
                    data.data = JSON.stringify(data.data);
                //Eğer method Get ise gönderilen dahayı sıfırla
                else if (data.method == 'GET')
                    data.data = null;


                //Zaman aşımı varsayılan
                if (data.timeout)
                    ajax.timeout = data.timeout ? data.timeout : 20000;

                //Devam eden işlemler
                ajax.onprogress = function() {
                    Service.Status = Service.StatusType.Loading;
                    Service.Done();
                };

                ajax.onerror = function() {
                    Service.Status = Service.StatusType.Error;
                    Service.Done();
                };

                //Zaman aşımı method
                ajax.ontimeout = function(e) {
                    Service.Status = Service.StatusType.Timeout;
                    Service.Done();
                };

                //Durumun olumlu olması durumunda
                if (ajax.readyState === XMLHttpRequest.DONE && ajax.status === 200) {

                    //İşlemi bitir
                    Service.Status = Service.StatusType.Success;

                    //Gelen veriyi dataType değerine göre çevir
                    var result = data.dataType != Service.ContentType.JSON ? ajax.responseText : JSON.parse(ajax.responseText);

                    //Veriyi sonuçlandır
                    Service.Done(result);
                }

                //Gönder gitsin
                ajax.send(data.data);

            } catch (ex) {
                Error.message('Sunucuya bağlantı sağlanamıyor');
                Service.Status = Service.StatusType.Error;
                console.log('Durum Kodu : code(' + Service.Status + ')\nHttp Sunucuya bağlantı sağlanamıyor' + ex);
            }

        }

        return Service;

    })()



    //Sayfada oluşturulacak görüntüler veya etkileşimler için kullanılacak
    var Display = (function() {

        function Display() {
            this.PhoneNumberForm = null;
        }

        //Ekranda kullanıcı için, telefon numarasını girebileceği bir form oluşturup gösterir
        Display.createPhoneNumberForm = function() {

            //Daha önce oluşturulmuş bir form yoksa ve temsilciyle iletişim sağlanmamışsa
            if (!Check.isInputForm && !Customer.isDelegate) {

                Display.PhoneNumberForm = d.createElement('div');
                Display.PhoneNumberForm.className = 'ekraninput';

                var phoneInputText = d.createElement('input');
                phoneInputText.type = 'text';
                phoneInputText.id = 'phonenumber';
                phoneInputText.maxLength = 10;

                var phoneInputButton = d.createElement('input');
                phoneInputButton.type = 'button';
                phoneInputButton.id = 'sender';
                phoneInputButton.value = 'GÖNDER';

                Display.PhoneNumberForm.innerHTML = '<h2>Telefon numaranızı yazınız</h2>';

                Listener(phoneInputButton, 'click', function() {
                    if (phoneInputText.value) {

                        if (phoneInputText.value[0] == '0') {
                            Error.message('Telefon numaranızı başında sıfır olmadan yazınız');
                            return false;
                        }

                        if (phoneInputText.value.length == 10) {
                            if (Check.isPhone('0' + phoneInputText.value)) {
                                Customer.PhoneNumber = phoneInputText.value;
                                Customer.getTicketFromDelegate();
                                Display.hidePhoneNumberForm(null);
                            } else
                                Error.message('Telefon numaranız geçersiz');
                        } else {
                            Error.message('Telefon numaranız eksik veya hatalı');
                        }
                    } else {
                        Error.message('Lütfen telefon numaranızı yazınız');
                    }
                });

                Listener(phoneInputText, 'keydown', function(e) {
                    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105))
                        return true;
                    else {
                        e.preventDefault();
                        return false;
                    }
                })

                Display.PhoneNumberForm.appendChild(phoneInputText);
                Display.PhoneNumberForm.appendChild(phoneInputButton);
                d.body.appendChild(Display.PhoneNumberForm);
                Check.isInputForm = true;
                phoneInputText.focus();
                Listener(w, 'keyup', Display.hidePhoneNumberForm);
                console.log('Telefon numarası girişi için form açıldı');
            }
        }

        Display.hidePhoneNumberForm = function(e) {
            var num = e != null ? e.which || e.keyCode : 0;
            //ESC
            if (num == 27 || num == 0) {
                Display.PhoneNumberForm.remove();
                Display.PhoneNumberForm = null;
                Listener(w, 'keyup', Display.hidePhoneNumberForm, true);
                console.log('Telefon numarası girişi için form Fkapatıldı');
            }
        }

        Display.OpenScreenLocked = function() {
            //Burada işlem sırasında ekranı kullanıcı için kitliyoruz
            //<div id='locked'></div>
        }

        return Display;
    })();



    //Olay eklemeleri için kullanılacak
    function Listener(obj, event, method, remove) {
        //Eklemeler
        if (obj.addEventListener && !remove)
            obj.addEventListener(event, method, false);
        else if (obj.attachEvent && !remove)
            obj.attachEvent('on' + event, method);

        //Remove true ise burası devreye girecek
        else if (obj.removeEventListener && remove)
            obj.removeEventListener(event, method, false);
        else if (obj.detachEvent && remove)
            obj.detachEvent('on' + event, method);
    }


    //Kullanıcının etkileşimde bulunabilmesi için KeyDown ve KeyUp Özelliklerini aktif ediyoruz
    var Key = (function() {

        function Key() {
            this.isKeyCtrl = false;
            this.isKeyAlt = false;
            this.isKeyValid = false;
        }

        Listener(d, 'keydown', function(e) {

            //Eğer Temsilci tarafından kontrol edilmiyorsa işleme dahil et
            if (!Customer.isDelegate) {

                //CTRL
                if (e.ctrlKey && !Key.isKeyCtrl) {
                    Key.isKeyCtrl = true;
                    return false;
                }
                //ALT
                else if (e.keyCode == 18 && !Key.isKeyAlt) {
                    Key.isKeyAlt = true;
                    return false;
                }
                //CTRL + ALT + H
                else if (Key.isKeyAlt && Key.isKeyCtrl && e.keyCode == 72) {
                    Customer.getPhoneNumber();
                    return false;
                }
            }
        })

        return Key;
    })()


    //Kullanıcıya ekranda gösterilecek uyarılar için
    var Error = (function() {

        function Error() {}
        Error.message = function(value) {
            alert(value);
        }

        return Error;
    })()



})(document, window);