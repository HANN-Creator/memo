const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

// JSON 요청 파싱을 위한 미들웨어 설정
app.use(express.json());

const FILE_PATH = './memos.json';

// JSON 파일에서 메모 읽기 (파일이 없으면 빈 배열 반환)
function readMemos() {
  return new Promise((resolve, reject) => {
    fs.readFile(FILE_PATH, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve([]);
        } else {
          return reject(err);
        }
      }
      try {
        const memos = JSON.parse(data);
        resolve(memos);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// JSON 파일에 메모 쓰기
function writeMemos(memos) {
  return new Promise((resolve, reject) => {
    fs.writeFile(FILE_PATH, JSON.stringify(memos, null, 2), 'utf8', (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// 전체 메모 목록 반환
app.get('/memo', async (req, res) => {
  try {
    const memos = await readMemos();
    res.json(memos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 새 메모 추가
app.post('/memo', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: '메모 내용이 없습니다.' });
    }
    const memos = await readMemos();
    // id 생성 (최대 id에 1을 더함)
    const newId = memos.length > 0 ? Math.max(...memos.map(memo => memo.id)) + 1 : 1;
    const newMemo = { id: newId, text };
    memos.push(newMemo);
    await writeMemos(memos);
    res.status(201).json(newMemo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 메모 수정
app.put('/memo/:id', async (req, res) => {
  try {
    const memoId = parseInt(req.params.id);
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: '수정할 메모 내용이 없습니다.' });
    }
    const memos = await readMemos();
    const memoIndex = memos.findIndex(memo => memo.id === memoId);
    if (memoIndex === -1) {
      return res.status(404).json({ error: '해당 메모를 찾을 수 없습니다.' });
    }
    memos[memoIndex].text = text; // 메모 내용 업데이트
    await writeMemos(memos);
    res.json(memos[memoIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 메모 삭제
app.delete('/memo/:id', async (req, res) => {
  try {
    const memoId = parseInt(req.params.id);
    const memos = await readMemos();
    const filteredMemos = memos.filter(memo => memo.id !== memoId);
    if (memos.length === filteredMemos.length) {
      return res.status(404).json({ error: '해당 메모를 찾을 수 없습니다.' });
    }
    await writeMemos(filteredMemos);
    res.json({ message: '메모가 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Memo API 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
