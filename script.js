const eventsList = document.getElementById('events-list');
        const addEventBtn = document.getElementById('add-event-btn');
        const previewCardsContainer = document.getElementById('preview-cards-container');
        const previewCode = document.getElementById('previewCode');
        const previewContainer = document.getElementById('previewContainer');
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        let eventCount = 0;

        /**
         * 新增活動表單
         */
        function addEventForm() {
            eventCount++;
            const template = document.getElementById('event-form-template');
            const clone = template.content.cloneNode(true);
            const eventDiv = clone.querySelector('.event-item');
            
            eventDiv.dataset.id = eventCount;
            eventDiv.querySelector('.event-number').textContent = `#${eventCount}`;

            const now = new Date();
            const later = new Date(now.getTime() + 3600000);
            const fmt = (d) => `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            
            eventDiv.querySelector('.start-manual').value = fmt(now);
            eventDiv.querySelector('.end-manual').value = fmt(later);

            bindEventItemListeners(eventDiv);
            eventsList.appendChild(eventDiv);
            updateRealTimePreview();
        }

        function bindEventItemListeners(el) {
            const startMan = el.querySelector('.start-manual');
            const startPick = el.querySelector('.start-picker');
            const endMan = el.querySelector('.end-manual');
            const endPick = el.querySelector('.end-picker');
            const allDay = el.querySelector('.all-day-check');
            const freq = el.querySelector('.rrule-freq');
            const untilContainer = el.querySelector('.rrule-until-container');

            startPick.addEventListener('change', (e) => {
                if (e.target.value) {
                    const val = e.target.value.replace('T', ' ').replace(/-/g, '/');
                    startMan.value = allDay.checked ? val.split(' ')[0] : val;
                    updateRealTimePreview();
                }
            });
            endPick.addEventListener('change', (e) => {
                if (e.target.value) {
                    const val = e.target.value.replace('T', ' ').replace(/-/g, '/');
                    endMan.value = allDay.checked ? val.split(' ')[0] : val;
                    updateRealTimePreview();
                }
            });

            allDay.addEventListener('change', () => {
                if (allDay.checked) {
                    if (startMan.value.includes(' ')) startMan.value = startMan.value.split(' ')[0];
                    if (endMan.value.includes(' ')) endMan.value = endMan.value.split(' ')[0];
                    startMan.placeholder = "YYYY/MM/DD";
                    endMan.placeholder = "YYYY/MM/DD";
                } else {
                    startMan.placeholder = "YYYY/MM/DD HH:mm";
                    endMan.placeholder = "YYYY/MM/DD HH:mm";
                }
                updateRealTimePreview();
            });

            freq.addEventListener('change', () => {
                untilContainer.classList.toggle('hidden', freq.value === '');
                updateRealTimePreview();
            });

            el.querySelectorAll('input, textarea, select').forEach(input => {
                input.addEventListener('input', updateRealTimePreview);
            });

            el.querySelector('.remove-event-btn').onclick = () => {
                if (document.querySelectorAll('.event-item').length > 1) {
                    el.remove();
                    updateRealTimePreview();
                } else {
                    showToast('至少需要保留一個活動');
                }
            };
        }

        function parseDate(str) {
            if (!str) return null;
            const d = new Date(str.replace(/\//g, '-'));
            return isNaN(d.getTime()) ? null : d;
        }

        function formatICSDate(date, isAllDay) {
            if (!date) return '';
            const pad = (n) => String(n).padStart(2, '0');
            const ymd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
            if (isAllDay) return ymd;
            return `${ymd}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
        }

        function formatDisplayDate(date) {
            if (!date) return null;
            const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
            return {
                full: `${date.getMonth() + 1}月${date.getDate()}日 (${weekDays[date.getDay()]})`,
                time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
            };
        }

        function updateRealTimePreview() {
            previewCardsContainer.innerHTML = '';
            const eventItems = document.querySelectorAll('.event-item');
            
            eventItems.forEach((item, idx) => {
                const summary = item.querySelector('.summary-input').value || `未命名活動 #${idx+1}`;
                const startVal = item.querySelector('.start-manual').value;
                const endVal = item.querySelector('.end-manual').value;
                const loc = item.querySelector('.location-input').value;
                const orgName = item.querySelector('.organizer-name-input').value;
                const orgEmail = item.querySelector('.organizer-email-input').value;
                const isAllDay = item.querySelector('.all-day-check').checked;
                const freq = item.querySelector('.rrule-freq').value;

                const start = parseDate(startVal);
                const end = parseDate(endVal);

                const card = document.createElement('div');
                card.className = 'gcal-card animate-in fade-in slide-in-from-right-4 duration-300';
                
                let timeHtml = '請設定正確的時間格式';
                if (start && end) {
                    const s = formatDisplayDate(start);
                    const e = formatDisplayDate(end);
                    const sameDay = start.toDateString() === end.toDateString();
                    
                    if (isAllDay) {
                        timeHtml = sameDay ? s.full : `${s.full} - ${e.full}`;
                    } else {
                        timeHtml = sameDay ? `${s.full} · ${s.time} – ${e.time}` : `${s.full} ${s.time} – ${e.full} ${e.time}`;
                    }
                }

                const freqText = freq ? `<span class="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase">重複: ${freq}</span>` : '';

                let orgInfo = '';
                if (orgName || orgEmail) {
                    orgInfo = `<div class="flex items-center text-sm text-slate-600"><svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg><span>${orgName || '未命名'} ${orgEmail ? `(${orgEmail})` : ''}</span></div>`;
                }

                card.innerHTML = `
                    <div class="gcal-blue-bar"></div>
                    <div class="p-5">
                        <div class="flex justify-between items-start">
                            <h3 class="text-xl text-slate-800 font-medium">${summary}</h3>
                            ${freqText}
                        </div>
                        <div class="mt-3 space-y-2">
                            <div class="flex items-center text-sm text-slate-600">
                                <svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>${timeHtml}</span>
                            </div>
                            ${loc ? `<div class="flex items-center text-sm text-slate-600"><svg class="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg><span>${loc}</span></div>` : ''}
                            ${orgInfo}
                        </div>
                    </div>
                `;
                previewCardsContainer.appendChild(card);
            });
        }

        function generateICSContent() {
            const eventItems = document.querySelectorAll('.event-item');
            let icsLines = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//ICS Generator Pro//TW',
                'CALSCALE:GREGORIAN',
                'METHOD:PUBLISH'
            ];

            const clean = (str) => str ? str.replace(/,/g, '\\,').replace(/\n/g, '\\n') : '';

            eventItems.forEach(item => {
                const summary = item.querySelector('.summary-input').value;
                const start = parseDate(item.querySelector('.start-manual').value);
                const end = parseDate(item.querySelector('.end-manual').value);
                const isAllDay = item.querySelector('.all-day-check').checked;
                const freq = item.querySelector('.rrule-freq').value;
                const until = parseDate(item.querySelector('.rrule-until').value);
                
                if (!summary || !start || !end) return;

                icsLines.push('BEGIN:VEVENT');
                const randomStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                icsLines.push(`UID:${Date.now()}-${randomStr}`);
                icsLines.push(`DTSTAMP:${formatICSDate(new Date(), false)}`);

                if (isAllDay) {
                    const nextDay = new Date(end);
                    nextDay.setDate(nextDay.getDate() + 1);
                    icsLines.push(`DTSTART;VALUE=DATE:${formatICSDate(start, true)}`);
                    icsLines.push(`DTEND;VALUE=DATE:${formatICSDate(nextDay, true)}`);
                } else {
                    icsLines.push(`DTSTART;TZID=Asia/Taipei:${formatICSDate(start, false)}`);
                    icsLines.push(`DTEND;TZID=Asia/Taipei:${formatICSDate(end, false)}`);
                }

                if (freq) {
                    let rrule = `RRULE:FREQ=${freq}`;
                    if (until) {
                        rrule += `;UNTIL=${formatICSDate(until, true)}T235959Z`;
                    }
                    icsLines.push(rrule);
                }

                icsLines.push(`SUMMARY:${clean(summary)}`);
                
                const loc = item.querySelector('.location-input').value;
                const orgName = item.querySelector('.organizer-name-input').value;
                const orgEmail = item.querySelector('.organizer-email-input').value;
                const desc = item.querySelector('.description-input').value;

                if (loc) icsLines.push(`LOCATION:${clean(loc)}`);
                
                if (orgName || orgEmail) {
                    const mailto = orgEmail || 'noreply@example.com';
                    const cn = orgName ? `;CN=${clean(orgName)}` : '';
                    icsLines.push(`ORGANIZER${cn}:MAILTO:${mailto}`);
                }

                if (desc) icsLines.push(`DESCRIPTION:${clean(desc)}`);

                icsLines.push('END:VEVENT');
            });

            icsLines.push('END:VCALENDAR');
            return icsLines.join('\r\n');
        }

        function showToast(msg) {
            toastMessage.textContent = msg;
            toast.classList.remove('opacity-0');
            toast.classList.add('opacity-100');
            setTimeout(() => {
                toast.classList.add('opacity-0');
                toast.classList.remove('opacity-100');
            }, 3000);
        }

        // --- 全域按鈕功能 ---

        document.getElementById('downloadBtn').onclick = () => {
            const content = generateICSContent();
            if (content.split('BEGIN:VEVENT').length <= 1) {
                showToast('請至少填寫一個活動的標題與時間');
                return;
            }
            const firstEventTitle = document.querySelector('.summary-input')?.value.trim() || 'my-calendar';
            const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${firstEventTitle}.ics`;
            link.click();
            showToast('ICS 檔案下載成功！');
        };

        document.getElementById('previewBtn').onclick = () => {
            previewCode.textContent = generateICSContent();
            previewContainer.classList.remove('hidden');
            previewContainer.scrollIntoView({ behavior: 'smooth' });
        };
        document.getElementById('closePreview').onclick = () => previewContainer.classList.add('hidden');

        // --- 初始化 ---

        addEventBtn.onclick = addEventForm;

        window.onload = () => {
            // 每次載入時重新開始，確保事件監聽器正確綁定
            eventsList.innerHTML = '';
            eventCount = 0;
            addEventForm();
        };