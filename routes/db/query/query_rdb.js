var queries = {};

queries.select_registered = (no) => {
    return `SELECT COUNT(*) as cnt FROM TB_REFUND_LIST WHERE no = "${no}" LIMIT 1`;
};

// 게시물 - 내용
queries.insert_article = (vendor, amount, no, title, writer, reg_date, url) => {
    return `INSERT INTO TB_REFUND_LIST VALUES (NULL, '${vendor}', '${amount}', '${no}', '${title}', '${writer}', '${reg_date}', '${url}');`;
};

module.exports = queries;
